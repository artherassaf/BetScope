from django.shortcuts import render
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .models import Transaction
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Sum, Q
from django.http import JsonResponse
from django.conf import settings
from datetime import datetime, timedelta
from plaid import ApiClient, Configuration
from plaid.api import plaid_api
from plaid.model.link_token_create_request import LinkTokenCreateRequest
from plaid.model.item_public_token_exchange_request import ItemPublicTokenExchangeRequest
from plaid.model.country_code import CountryCode
from plaid.model.products import Products
import json
import random
from django.db.models.functions import Coalesce
from django.db.models import F, Value, DecimalField

# Initialize Plaid configuration and client
configuration = Configuration(
    host="https://sandbox.plaid.com",
    api_key={
        'clientId': settings.PLAID_CLIENT_ID,
        'secret': settings.PLAID_SECRET,
    }
)
client = ApiClient(configuration)
plaid_client = plaid_api.PlaidApi(client)

User = get_user_model()

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    """Register a new user."""
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({'error': 'Username and password are required.'}, status=400)

        if User.objects.filter(username=username).exists():
            return JsonResponse({'error': 'Username already exists.'}, status=400)

        user = User.objects.create_user(username=username, password=password)
        return JsonResponse({'message': 'User registered successfully.'}, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Error registering user: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def login_user(request):
    try:
        data = json.loads(request.body)
        username = data.get('username')
        password = data.get('password')

        user = authenticate(request, username=username, password=password)
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return JsonResponse({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=200)
        else:
            return JsonResponse({'error': 'Invalid credentials.'}, status=401)
    except Exception as e:
        return JsonResponse({'error': f'Error logging in user: {str(e)}'}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_transaction(request):
    """
    This basically recieves data from a user and stores it in the database
    Adds a new transaction for the logged-in user.
    Body Params:
    - transaction_type (str): Either 'deposit' or 'withdrawal'.
    - amount (float): Transaction amount.
    - date (YYYY-MM-DD): Date of the transaction.
    - platform (str): Platform name where the transaction occurred.
    Returns:
    - Success message upon successful creation of the transaction.
    """
    try:
        data = json.loads(request.body)
        transaction = Transaction.objects.create(
            user=request.user,
            transaction_type=data['transaction_type'],
            amount=data['amount'],
            date=data['date'],
            platform=data['platform']
        )
        return JsonResponse({'message': 'Transaction added successfully!'}, status=201)
    except Exception as e:
        return JsonResponse({'error': f'Error adding transaction: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def clear_transactions(request):
    """Clear all transactions for the logged-in user."""
    try:
        Transaction.objects.filter(user=request.user).delete()
        return JsonResponse({'message': 'All transactions cleared successfully!'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error clearing transactions: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_transaction(request):
    """
    GET /api/transactions/
    this endpoint retrieves transactions for a given date range.
    Query Params:
    - start_date (YYYY-MM-DD): Start of the date range
    - end_date (YYYY-MM-DD): End of the date range
    Returns:
    - List of transactions filtered by the given date range.
    """
    try:
        start_date = request.GET.get('start_date')
        end_date = request.GET.get('end_date')

        transactions = Transaction.objects.filter(user=request.user)
        if start_date and end_date:
            start_date = datetime.strptime(start_date, '%Y-%m-%d').date()
            end_date = datetime.strptime(end_date, '%Y-%m-%d').date()
            transactions = transactions.filter(date__range=[start_date, end_date])

        aggregated_data = (
            transactions.values('date', 'platform', 'transaction_type', 'amount')
            .annotate(
                net_amount=Coalesce(
                    Sum('amount', filter=Q(transaction_type='withdrawal'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ) - Coalesce(
                    Sum('amount', filter=Q(transaction_type='deposit'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
                deposit_total=Coalesce(
                    Sum('amount', filter=Q(transaction_type='deposit'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
                withdrawal_total=Coalesce(
                    Sum('amount', filter=Q(transaction_type='withdrawal'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
            )
            .order_by('date')
        )
        
        return JsonResponse({'transactions': list(aggregated_data)}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error fetching transactions: {str(e)}'}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def fetch_transactions(request):
    """
    POST /api/fetch_transactions/
    Fetches transactions from the Plaid API for the logged-in user and filters relevant betting transactions.
    Body Params:
    - access_token (str): Plaid access token for fetching transactions.
    Returns:
    - Success message upon fetching and storing the transactions.
    Filters:
    - Only betting-related transactions are saved.
    """
    try:
        body = json.loads(request.body)
        access_token = body.get('access_token')

        if not access_token:
            return JsonResponse({'error': 'Missing access_token in request body'}, status=400)

        start_date = (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')
        end_date = datetime.now().strftime('%Y-%m-%d')

        response = plaid_client.transactions_get({
            'access_token': access_token,
            'start_date': start_date,
            'end_date': end_date,
        })

        transactions = response['transactions']
        betting_keywords = ['Bet365', 'DraftKings', 'FanDuel', 'Sportsbook']

        betting_transactions = [
            txn for txn in transactions
            if any(keyword.lower() in txn['name'].lower() for keyword in betting_keywords)
        ]

        for txn in betting_transactions:
            Transaction.objects.create(
                user=request.user,
                transaction_type='withdrawal' if txn['amount'] > 0 else 'deposit',
                amount=abs(txn['amount']),
                date=txn['date'],
                platform=txn['name']
            )

        return JsonResponse({'message': 'Betting transactions fetched and saved successfully!'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error fetching transactions: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def simulate_transactions(request):
    """
    This simulates transactions for a given month and year.
    Body Params:
    - month (int): Month to simulate (1-12)
    - year (int): Year to simulate
    Returns:
    - Success message upon generating simulated transactions.
    """
    try:
        platforms = ['Bet365', 'DraftKings', 'FanDuel', 'PointsBet', "BetMGM"]
        transaction_types = ['deposit', 'withdrawal']

        # Extract the target month and year from the request, default to the current month
        target_month = request.data.get('month', datetime.now().month)
        target_year = request.data.get('year', datetime.now().year)

        # Calculate the start and end dates of the target month
        
      
        start_of_month = datetime(target_year, target_month, 1)
        days_in_month = (start_of_month.replace(month=target_month % 12 + 1, day=1) - timedelta(days=1)).day

        simulated_transactions = []
        for _ in range(random.randint(5, 10)):
            transaction_type = random.choice(transaction_types)
            amount = round(random.uniform(10, 500))
            random_day = random.randint(1, days_in_month)
            date = start_of_month + timedelta(days=random_day - 1)

            platform = random.choice(platforms)

            Transaction.objects.create(
                user=request.user,
                transaction_type=transaction_type,
                amount=amount,
                date=date,
                platform=platform
            )

            simulated_transactions.append({
                'transaction_type': transaction_type,
                'amount': amount,
                'date': str(date),
                'platform': platform
            })

        return JsonResponse({'simulated_transactions': simulated_transactions, 'message': 'Simulated transactions added successfully!'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error simulating transactions: {str(e)}'}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_link_token(request):
    try:
        request_body = LinkTokenCreateRequest(
            user={"client_user_id": str(request.user.id)},
            client_name="BetScope",
            products=[Products('transactions')],
            country_codes=[CountryCode('CA')],
            language="en",
            redirect_uri="http://localhost:3000/",
        )
        response = plaid_client.link_token_create(request_body)
        link_token = response.link_token
        return JsonResponse({'link_token': link_token}, status=200)
    except Exception as e:
        return JsonResponse({'error': f"Error generating link token: {str(e)}"}, status=500)

@csrf_exempt
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def exchange_public_token(request):
    try:
        data = json.loads(request.body)
        public_token = data.get('public_token')

        if not public_token:
            return JsonResponse({'error': 'Missing public_token in request body'}, status=400)

        exchange_request = ItemPublicTokenExchangeRequest(public_token=public_token)
        response = plaid_client.item_public_token_exchange(exchange_request)
        access_token = response.access_token
        item_id = response.item_id

        user = request.user
        user.access_token = access_token
        user.item_id = item_id
        user.save()

        return JsonResponse({'message': 'Access token saved successfully'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error exchanging public token: {str(e)}'}, status=500)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_user(request):
    """Log out the user and invalidate tokens."""
    try:
        refresh_token = request.data.get('refresh')
        token = RefreshToken(refresh_token)
        token.blacklist()
        return JsonResponse({'message': 'User logged out successfully.'}, status=200)
    except Exception as e:
        return JsonResponse({'error': f'Error logging out user: {str(e)}'}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user(request):
    """Get the logged-in user's details."""
    user = request.user
    return JsonResponse({
        'id': user.id,
        'username': user.username,
    })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profit_by_platform(request):
    """
    Retrieves total net profit grouped by platform.
    Returns:
    - List of objects with platform name and net profit for each platform.
    """

    try:
        # Fetch transactions for the authenticated user
        transactions = Transaction.objects.filter(user=request.user)

        # Ensure no null values in the `platform` field, use a new alias
        transactions = transactions.annotate(
            annotated_platform=Coalesce('platform', Value('Other'))
        )

        # Aggregate profit by platform
        profit_by_platform = (
            
            transactions
            .values('annotated_platform')  # Use the alias here
            .annotate(
                total_withdrawals=Coalesce(
                    Sum('amount', filter=Q(transaction_type__iexact='withdrawal'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
                total_deposits=Coalesce(
                    Sum('amount', filter=Q(transaction_type__iexact='deposit'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
                net_profit=Coalesce(
                    Sum('amount', filter=Q(transaction_type__iexact='withdrawal'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ) - Coalesce(
                    Sum('amount', filter=Q(transaction_type__iexact='deposit'), output_field=DecimalField()),
                    Value(0, output_field=DecimalField())
                ),
            )
            .order_by('-net_profit')  # Optional: Order by highest profit
        )

        # Format the response
        response_data = [
            {
                'platform': entry['annotated_platform'],  # Use the alias here
                'net_profit': float(entry['net_profit']),  # Ensure serializable format
            }
            for entry in profit_by_platform
        ]

        return JsonResponse({'profit_by_platform': response_data}, status=200)

    except Exception as e:
        # Log the exception for debugging
        print(f"Error in get_profit_by_platform: {str(e)}")
        return JsonResponse({'error': f'Error calculating profit by platform: {str(e)}'}, status=500)
