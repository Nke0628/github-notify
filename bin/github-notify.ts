#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { GithubNotifyStack } from '../lib/github-notify-stack';

const app = new cdk.App();
new GithubNotifyStack(app, 'GithubNotifyStack');
