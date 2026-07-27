import { Controller, Post, Get, Body, UseGuards, Req, Res, HttpCode, HttpStatus } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { AuthService } from './auth.service'
import { LoginDto, RegisterDto, RefreshTokenDto, SetupMfaDto, VerifyMfaDto } from './dto/auth.dto'
import { Public } from '../../common/decorators/public.decorator'
import { Request } from 'express'

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User login with email/password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto)
  }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user account' })
  @ApiResponse({ status: 201, description: 'Registration successful' })
  @ApiResponse({ status: 400, description: 'Email already exists' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto)
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshToken(@Body() refreshTokenDto: RefreshTokenDto) {
    return this.authService.refreshToken(refreshTokenDto)
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and revoke refresh token' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  async logout(@Body() body: { refreshToken: string }, @Req() req: Request) {
    const userId = (req as any).user?.sub
    await this.authService.logout(body.refreshToken, userId)
    return { message: 'Logout successful' }
  }

  @Post('mfa/setup')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Setup MFA (TOTP)' })
  @ApiResponse({ status: 200, description: 'MFA setup initiated' })
  async setupMfa(@Body() setupDto: SetupMfaDto, @Req() req: Request) {
    const userId = (req as any).user.sub
    return this.authService.setupMfa(userId, setupDto)
  }

  @Post('mfa/verify')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Verify MFA code and enable' })
  @ApiResponse({ status: 200, description: 'MFA enabled' })
  async verifyMfa(@Body() verifyDto: VerifyMfaDto, @Req() req: Request) {
    const userId = (req as any).user.sub
    await this.authService.verifyAndEnableMfa(userId, verifyDto)
    return { message: 'MFA enabled successfully' }
  }

  @Post('mfa/disable')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Disable MFA' })
  @ApiResponse({ status: 200, description: 'MFA disabled' })
  async disableMfa(@Body() body: { password: string }, @Req() req: Request) {
    const userId = (req as any).user.sub
    await this.authService.disableMfa(userId, body.password)
    return { message: 'MFA disabled successfully' }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Current user profile' })
  async getMe(@Req() req: Request) {
    return (req as any).user
  }
}
