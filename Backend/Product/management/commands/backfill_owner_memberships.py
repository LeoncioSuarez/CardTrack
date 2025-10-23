from django.core.management.base import BaseCommand
from Product.models import Board, BoardMembership


class BaseLogger:
    def __init__(self, stdout):
        self.stdout = stdout

    def info(self, msg):
        self.stdout.write(msg)


class Command(BaseCommand):
    help = "Ensure every Board has an owner membership for Board.user. Creates missing BoardMembership(owner)."

    def handle(self, *args, **options):
        logger = BaseLogger(self.stdout)
        created = 0
        for board in Board.objects.select_related('user').all():
            membership, was_created = BoardMembership.objects.get_or_create(
                board=board,
                user=board.user,
                defaults={"role": BoardMembership.ROLE_OWNER},
            )
            if was_created:
                created += 1
                logger.info(f"Created owner membership for board #{board.id} '{board.title}' -> {board.user.email}")
        logger.info(f"Done. Created {created} owner memberships.")
