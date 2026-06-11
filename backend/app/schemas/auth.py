from uuid import UUID
from pydantic import BaseModel, EmailStr
from app.models.user import UserRole


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    token: str
    new_password: str


class InviteUserRequest(BaseModel):
    email: EmailStr
    role: UserRole


class UserOut(BaseModel):
    id: UUID
    email: str
    role: UserRole
    is_active: bool

    model_config = {"from_attributes": True}
