import { Body, Controller, Post } from '@nestjs/common';
import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LogoutDto } from '../dto/logout.dto';
import { AuthService } from '../auth.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GithubAuthGuard } from '../guards/github-auth.guard';
import { Get, Request } from '@nestjs/common';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  logout(@Body() logoutDto: LogoutDto) {
    return this.authService.logout(logoutDto.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport handles the redirect to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Request() req: any) {
    return this.authService.googleLogin(req.user);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Passport redirects the user to GitHub.
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(@Request() req: any) {
    return this.authService.githubLogin(req.user);
  }
}
