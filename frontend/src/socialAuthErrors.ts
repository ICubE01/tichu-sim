const errorMessages: Record<string, string> = {
  "An account with this email already exists. Log in and connect from account settings.":
    "이 이메일로 가입된 계정이 있습니다. 로그인 후 계정 설정에서 연결해 주세요.",
  "This social account is already linked to another user.":
    "이 소셜 계정은 이미 다른 사용자에 연결되어 있습니다.",
  "Unknown provider.": "알 수 없는 로그인 제공자입니다.",
  "access_denied": "로그인이 취소되었습니다.",
};

export function translateSocialAuthError(message: string): string {
  return errorMessages[message] ?? message;
}
