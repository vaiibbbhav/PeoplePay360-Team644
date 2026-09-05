import { UnauthorizedError } from '../../shared/errors';

export class EmailNotVerifiedError extends UnauthorizedError {
  constructor(
    message: string = 'Please verify your email before logging in. Check your inbox for the verification link.',
  ) {
    super(message, 'EMAIL_NOT_VERIFIED');
    this.name = 'EmailNotVerifiedError';
  }
}
