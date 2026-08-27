import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

import {
  welcomeTemplate,
} from './templates/welcome.template';

import {
  loginAlertTemplate,
} from './templates/login-alert.template';

@Injectable()
export class MailService {
  private readonly logger = new Logger(
    MailService.name,
  );

  private readonly transporter: nodemailer.Transporter;

  constructor(
    private readonly configService: ConfigService,
  ) {
    this.transporter =
      nodemailer.createTransport({
        host: this.configService.get<string>(
          'mail.host',
        ),

        port: this.configService.get<number>(
          'mail.port',
        ),

        secure:
          this.configService.get<boolean>(
            'mail.secure',
          ) ?? false,

        auth: {
          user:
            this.configService.get<string>(
              'mail.user',
            ),

          pass:
            this.configService.get<string>(
              'mail.password',
            ),
        },
      });
  }

  async sendWelcomeEmail(
    email: string,
    name: string,
  ) {
    const html = welcomeTemplate(name);

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'mail.from',
      ),

      to: email,

      subject: 'Welcome to Task Management',

      html,
    });
  }

  async sendLoginSecurityAlert(
    email: string,
    name: string,
  ) {
    const html = loginAlertTemplate(name);

    await this.transporter.sendMail({
      from: this.configService.get<string>(
        'mail.from',
      ),

      to: email,

      subject: 'New Login to Your Account',

      html,
    });
  }
}