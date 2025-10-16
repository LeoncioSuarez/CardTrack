from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from Product.models import User

class Command(BaseCommand):
    help = 'Migrate plaintext password_hash values to hashed passwords for Users.'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show which users would be migrated without saving changes')

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        users = User.objects.all()
        migrated = 0
        for u in users:
            ph = (u.password_hash or '').strip()
            # heuristic: assume plaintext if it doesn't contain a $ (common in Django hashers)
            if ph and ('$' not in ph):
                self.stdout.write(f"Would migrate user {u.email} (id={u.id})")
                if not dry_run:
                    u.password_hash = make_password(ph)
                    u.save()
                    migrated += 1
        if dry_run:
            self.stdout.write(self.style.WARNING('Dry run complete. No changes applied.'))
        else:
            self.stdout.write(self.style.SUCCESS(f'Migration complete. {migrated} users updated.'))
