from django.db import models

#   User
def upload_to_user_profile(instance, filename):
    """Place uploaded user profile images under profilepic/users/<user_id>/filename.

    If the instance has no id yet (unsaved), place in a temp folder with timestamp.
    """
    import time, os
    base = 'profilepic/users'
    name = os.path.basename(filename)
    if instance and getattr(instance, 'id', None):
        return f"{base}/{instance.id}/{name}"
    else:
        return f"{base}/temp/{int(time.time())}_{name}"


class User(models.Model):
    profilepicture = models.ImageField(upload_to=upload_to_user_profile, default='profilepic/default.png')
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password_hash = models.CharField(max_length=255)  
    aboutme = models.TextField(blank=True, null=True, max_length=255)
    registration_date = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return self.email

    @property
    def is_authenticated(self):
        """
        Permite que rest_framework.permissions.IsAuthenticated
        trate a este modelo como autenticado sin integrar Django Auth.
        """
        return True

#   Table
class Board(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="boards")
    title = models.CharField(max_length=100)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} ({self.user.email})"


class BoardMembership(models.Model):
    """Membership and roles per board.

    Roles:
    - owner: full control (typically the Board.user)
    - editor: can modify board content (columns/cards), invite viewers
    - viewer: read-only access
    """

    ROLE_OWNER = 'owner'
    ROLE_EDITOR = 'editor'
    ROLE_VIEWER = 'viewer'
    ROLE_CHOICES = [
        (ROLE_OWNER, 'Owner'),
        (ROLE_EDITOR, 'Editor'),
        (ROLE_VIEWER, 'Viewer'),
    ]

    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name='memberships')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='memberships')
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_VIEWER)
    invited_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('board', 'user')
        indexes = [
            models.Index(fields=['board', 'user']),
        ]
        verbose_name = 'Board Membership'
        verbose_name_plural = 'Board Memberships'

    def __str__(self):
        return f"{self.user.email} -> {self.board.title} ({self.role})"


# Ensure board owner is always recorded as a membership with role=owner
from django.db.models.signals import post_save
from django.dispatch import receiver


@receiver(post_save, sender=Board)
def ensure_owner_membership(sender, instance: Board, created: bool, **kwargs):
    # Create or ensure owner membership exists for the board owner
    BoardMembership.objects.get_or_create(
        board=instance,
        user=instance.user,
        defaults={'role': BoardMembership.ROLE_OWNER},
    )


#   Column
class Column(models.Model):
    board = models.ForeignKey(Board, on_delete=models.CASCADE, related_name="columns")
    title = models.CharField(max_length=100)
    position = models.IntegerField(default=0)  
    color = models.CharField(max_length=7, default='#007ACF')
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

class Release(models.Model):
    release_title = models.CharField(max_length=100)
    release_description = models.TextField(blank=True, null=True)
    release_date = models.DateTimeField(auto_now_add=True)


class CarouselImage(models.Model):
    image = models.ImageField(upload_to='carousel/')
    title = models.CharField(max_length=200, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.TextField(blank=True)
    link_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    position = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["position", "-created_at"]
        verbose_name = "Carousel Image"
        verbose_name_plural = "Carousel Images"

    def __str__(self):
        return self.title or f"CarouselImage #{self.pk}"
