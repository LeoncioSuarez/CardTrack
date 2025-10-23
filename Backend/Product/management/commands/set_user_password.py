from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.hashers import make_password
from getpass import getpass

from Product.models import User


class Command(BaseCommand):
    help = "Set or reset the password for a Product.User (stores a hashed password)."

    def add_arguments(self, parser):
        group = parser.add_mutually_exclusive_group(required=True)
        group.add_argument('--email', type=str, help='Email of the user to update')
        group.add_argument('--id', type=int, help='ID of the user to update')
        parser.add_argument('--password', type=str, help='New password (omit to be prompted interactively)')
        parser.add_argument('--dry-run', action='store_true', help='Do not persist changes, just show what would happen')

    def handle(self, *args, **options):
        email = options.get('email')
        user_id = options.get('id')
        password = options.get('password')
        dry_run = options.get('dry_run')

        # Locate user
        try:
            if email:
                user = User.objects.get(email=email)
            else:
                user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            identifier = email or f'id={user_id}'
            raise CommandError(f'User with {identifier} does not exist')

        if not password:
            # prompt without echo
            password = getpass('Enter new password: ')
            confirm = getpass('Confirm new password: ')
            if password != confirm:
                raise CommandError('Passwords do not match')
            if not password:
                raise CommandError('Password cannot be empty')

        hashed = make_password(password)

        if dry_run:
            self.stdout.write(self.style.WARNING(
                f"[DRY-RUN] Would update user {user.id} <{user.email}> password_hash to a hashed value."
            ))
            return

        user.password_hash = hashed
        user.save(update_fields=['password_hash'])

        self.stdout.write(self.style.SUCCESS(
            f"Password updated for user {user.id} <{user.email}>"
        ))
