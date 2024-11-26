from django.urls import path
from . import views
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    # Plaid Endpoints
    path('exchange_public_token/', views.exchange_public_token, name='exchange_public_token'),
    path('create_link_token/', views.create_link_token, name='create_link_token'),
    path('fetch_transactions/', views.fetch_transactions, name='fetch_transactions'),

    # Transaction Endpoints
    path('transactions/add/', views.add_transaction, name='add_transaction'),
    path('transactions/', views.get_transaction, name='get_transactions'),

    # Authentication Endpoints
    path('signup/', views.register_user, name='signup'),
    path('login/', views.login_user, name='login_user'),
    path('logout/', views.logout_user, name='logout_user'),
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('user/', views.get_user, name='get_user'),
    path('simulate_transactions/', views.simulate_transactions, name='simulate_transactions'),
    path('clear_transactions/', views.clear_transactions, name='clear_transactions'),
    path('profit-by-platform/', views.get_profit_by_platform, name='get_profit_by_platform'),  # New endpoint
    path('transactions/profit-by-platform/', views.get_profit_by_platform, name='get_profit_by_platform'),  # New endpoint
    path('bets/profit-by-platform/', views.get_profit_by_platform, name='get_profit_by_platform'),  # New endpoint




]
