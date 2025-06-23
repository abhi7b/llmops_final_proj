import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as apprunner from 'aws-cdk-lib/aws-apprunner';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // NOTE: S3 bucket is not created by this stack. Use an existing bucket and set S3_BUCKET_NAME as an environment variable in your deployment.

    // Create IAM role for App Runner
    const appRunnerRole = new iam.Role(this, 'AppRunnerRole', {
      assumedBy: new iam.ServicePrincipal('build.apprunner.amazonaws.com'),
    });

    // Add necessary permissions to the role (Bedrock and CloudWatch only)
    appRunnerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
          'cloudwatch:PutMetricData'
        ],
        resources: ['*'],
      })
    );

    // Create App Runner service
    const appRunnerService = new apprunner.Service(this, 'ImageTitlingService', {
      source: apprunner.Source.fromGitHub({
        repositoryUrl: 'https://github.com/your-username/automatic-image-titling',
        branch: 'main',
        configurationSource: apprunner.ConfigurationSourceType.REPOSITORY,
      }),
      role: appRunnerRole,
      environment: {
        AWS_REGION: this.region || 'us-east-1',
        // S3_BUCKET_NAME should be set in your deployment environment
      },
    });

    // Output the App Runner service URL
    new cdk.CfnOutput(this, 'ServiceUrl', {
      value: appRunnerService.serviceUrl,
      description: 'The URL of the Image Titling service',
    });

    // Output the S3 bucket name
    new cdk.CfnOutput(this, 'ImageBucketName', {
      value: imageBucket.bucketName,
      description: 'The name of the S3 bucket for image storage',
    });

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'InfrastructureQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
