import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { LoginDto } from '../dto/login.dto';
import { RefreshTokenDto } from '../dto/refresh-token.dto';
import { LogoutDto } from '../dto/logout.dto';

import { AuthService } from '../auth.service';

import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { GoogleAuthGuard } from '../guards/google-auth.guard';
import { GithubAuthGuard } from '../guards/github-auth.guard';

import type { AuthenticatedRequest } from '../interfaces/authenticated-request.interface';
import type { OAuthProfile } from '../interfaces/oauth-profile.interface';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  login(
    @Body() loginDto: LoginDto,
    @Req() req: Request,
  ) {
    return this.authService.login(loginDto, req.ip);
  }

  @Post('refresh')
  refresh(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refresh(refreshTokenDto.refreshToken);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @Body() logoutDto: LogoutDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.authService.logout(
      logoutDto.refreshToken,
      req.user.userId,
    );
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Req() req: AuthenticatedRequest) {
    return req.user;
  }

  @Get('google')
  @UseGuards(GoogleAuthGuard)
  googleLogin() {
    // Passport handles the redirect to Google.
  }

  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  googleCallback(@Req() req: { user: OAuthProfile }) {
    return this.authService.googleLogin(req.user);
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  githubLogin() {
    // Passport handles the redirect to GitHub.
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  githubCallback(@Req() req: { user: OAuthProfile }) {
    return this.authService.githubLogin(req.user);
  }
}