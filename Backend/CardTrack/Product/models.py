from django.db import models

#   User
class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)  
    registration_date = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email

#   Table
class Board(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="boards")
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.email})"


#   Column
class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="columns")
    title = models.CharField(max_length=100)
    position = models.IntegerField(default=0)  
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position"] 

    def __str__(self):
        return f"{self.title} - {self.board.title}"


#   Card
class Card(models.Model):
    column = models.ForeignKey(Column, on_delete=models.CASCADE, related_name="cards")
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    position = models.IntegerField(default=0) 
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    priority = models.CharField(
        max_length=10,
        choices=[('low','Low'),('medium','Medium'),('high','High')],
        default='medium'
    )

    class Meta:
        ordering = ["position"]

    def __str__(self):
        return f"{self.title} ({self.column.title})"

