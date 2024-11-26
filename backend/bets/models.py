from django.db import models
from django.contrib.auth.models import AbstractUser

# Custom user model
class CustomUser(AbstractUser):
    def __str__(self):
        return self.username

# Transaction model
class Transaction(models.Model):
    """
    Represents a financial transaction.
    I like to think of the fields like columns in a a big database table.
    We are responsible for defining these fields within our class
    Fields:
      - user: The user who owns the transaction.
      - date: The date of the transaction.
      - transaction_type: Type of transaction ('deposit' or 'withdrawal').
      - amount: The amount of money involved in the transaction.
      - platform: The betting platform associated with the transaction.
    """

    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
    ]

    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE, related_name='transactions')
    transaction_type = models.CharField(max_length=10, choices=TRANSACTION_TYPES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField()
    platform = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.transaction_type.capitalize()} of ${self.amount} on {self.date} via {self.platform}"
