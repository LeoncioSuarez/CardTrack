from django.test import TestCase
from django.contrib.auth.hashers import check_password, make_password
from rest_framework import status
from rest_framework.test import APIClient

from .models import User, Board, Column, Card


class UserAuthTests(TestCase):
    """
    Pruebas para registro, login y endpoint de perfil (me).
    """

    def setUp(self):
        self.client = APIClient()

    def test_register_creates_user_and_hashes_password(self):
        payload = {
            "name": "Alice",
            "email": "alice@example.com",
            "password": "s3cret!",
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        self.assertNotIn("password", res.data)
        self.assertIn("id", res.data)
        self.assertEqual(res.data["email"], payload["email"])

        user = User.objects.get(email=payload["email"])
        self.assertTrue(check_password("s3cret!", user.password_hash))

    def test_login_success_and_me(self):
        payload = {
            "name": "Bob",
            "email": "bob@example.com",
            "password": "topsecret",
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

        # Login
        login_res = self.client.post(
            "/api/users/login/",
            {"email": payload["email"], "password": payload["password"]},
            format="json",
        )
        self.assertEqual(login_res.status_code, status.HTTP_200_OK)
        self.assertIn("token", login_res.data)
        token = login_res.data["token"]


        me_res = self.client.get(
            "/api/users/me/",
            HTTP_AUTHORIZATION=f"Token {token}",
        )
        self.assertEqual(me_res.status_code, status.HTTP_200_OK)
        self.assertEqual(me_res.data["email"], payload["email"])


        user = User.objects.get(email=payload["email"])
        self.assertIsNotNone(user.last_login)

    def test_login_wrong_password(self):

        payload = {
            "name": "Eve",
            "email": "eve@example.com",
            "password": "goodpass",
        }
        res = self.client.post("/api/users/register/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)


        bad_login_res = self.client.post(
            "/api/users/login/",
            {"email": payload["email"], "password": "badpass"},
            format="json",
        )
        self.assertEqual(bad_login_res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("error", bad_login_res.data)

    def test_me_without_token_is_unauthorized(self):
        res = self.client.get("/api/users/me/")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class BoardColumnCardTests(TestCase):
    """
    Pruebas de endpoints CRUD y reglas de orden en columnas y tarjetas.
    """

    def setUp(self):
        self.client = APIClient()

        self.user = User.objects.create(
            name="Owner",
            email="owner@example.com",
            password_hash=make_password("ownerpass"),
        )

    def test_create_board_and_list(self):
        payload = {"title": "Proyecto X", "description": "Demo", "user": self.user.id}
        res = self.client.post("/api/boards/", payload, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        board_id = res.data["id"]

        list_res = self.client.get("/api/boards/")
        self.assertEqual(list_res.status_code, status.HTTP_200_OK)
        self.assertTrue(any(b["id"] == board_id for b in list_res.data))

    def test_nested_columns_crud_and_ordering(self):
        # Crear board
        board_res = self.client.post(
            "/api/boards/",
            {"title": "Proyecto", "description": "Test", "user": self.user.id},
            format="json",
        )
        self.assertEqual(board_res.status_code, status.HTTP_201_CREATED)
        board_id = board_res.data["id"]


        col2 = self.client.post(
            f"/api/boards/{board_id}/columns/",
            {"title": "Doing", "position": 2},
            format="json",
        )
        self.assertEqual(col2.status_code, status.HTTP_201_CREATED)
        col1 = self.client.post(
            f"/api/boards/{board_id}/columns/",
            {"title": "Todo", "position": 1},
            format="json",
        )
        self.assertEqual(col1.status_code, status.HTTP_201_CREATED)


        cols = self.client.get(f"/api/boards/{board_id}/columns/")
        self.assertEqual(cols.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(cols.data), 2)
        self.assertLessEqual(cols.data[0]["position"], cols.data[1]["position"])

    def test_nested_cards_crud_and_ordering_and_scoping(self):

        board = self.client.post(
            "/api/boards/",
            {"title": "Proyecto", "description": "Cards", "user": self.user.id},
            format="json",
        ).data
        board_id = board["id"]

        col_a = self.client.post(
            f"/api/boards/{board_id}/columns/",
            {"title": "Backlog", "position": 2},
            format="json",
        ).data
        col_b = self.client.post(
            f"/api/boards/{board_id}/columns/",
            {"title": "Ready", "position": 1},
            format="json",
        ).data

        c3 = self.client.post(
            f"/api/boards/{board_id}/columns/{col_a['id']}/cards/",
            {"title": "Task 3", "position": 3},
            format="json",
        )
        self.assertEqual(c3.status_code, status.HTTP_201_CREATED)

        c1 = self.client.post(
            f"/api/boards/{board_id}/columns/{col_a['id']}/cards/",
            {"title": "Task 1", "position": 1},
            format="json",
        )
        self.assertEqual(c1.status_code, status.HTTP_201_CREATED)

        cb = self.client.post(
            f"/api/boards/{board_id}/columns/{col_b['id']}/cards/",
            {"title": "Other col", "position": 2},
            format="json",
        )
        self.assertEqual(cb.status_code, status.HTTP_201_CREATED)


        list_a = self.client.get(
            f"/api/boards/{board_id}/columns/{col_a['id']}/cards/"
        )
        self.assertEqual(list_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_a.data), 2)
        self.assertEqual(list_a.data[0]["title"], "Task 1")
        self.assertEqual(list_a.data[1]["title"], "Task 3")


        list_b = self.client.get(
            f"/api/boards/{board_id}/columns/{col_b['id']}/cards/"
        )
        self.assertEqual(list_b.status_code, status.HTTP_200_OK)
        self.assertEqual(len(list_b.data), 1)

    def test_string_representations(self):
        board = Board.objects.create(user=self.user, title="B1", description="")
        col = Column.objects.create(board=board, title="C1", position=0)
        card = Card.objects.create(column=col, title="T1", position=0)
        self.assertIn(self.user.email, str(board))
        self.assertIn(board.title, str(col))
        self.assertIn(col.title, str(card))
