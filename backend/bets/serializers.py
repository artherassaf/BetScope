from rest_framework import serializers
from .models import Transaction, CustomUser

# CustomUser serializer
class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username']

# Transaction serializer
class TransactionSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = Transaction
        fields = [
            'id', 'user', 'transaction_type', 'amount', 'date', 
            'platform', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
