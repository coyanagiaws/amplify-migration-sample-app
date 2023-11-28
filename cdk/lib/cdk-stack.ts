import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import { IdentityPool, UserPoolAuthenticationProvider } from '@aws-cdk/aws-cognito-identitypool-alpha';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as nodeLambda from 'aws-cdk-lib/aws-lambda-nodejs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';

export class CdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const userPool = new cognito.UserPool(this, 'UserPool', {
      userPoolName: `amplify-migration-sample-app-UserPool`,
      selfSignUpEnabled: false,
      signInAliases: {
        username: false,
        phone: false,
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, 'UserPoolClient', {
      userPool: userPool,
      userPoolClientName: 'frontend',
      generateSecret: false,
      oAuth: {
        scopes: [
          cognito.OAuthScope.EMAIL,
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.COGNITO_ADMIN,
          cognito.OAuthScope.PROFILE,
        ],
      },
    });

    const identityPool = new IdentityPool(this, 'IdentityPool', {
      identityPoolName: `amplify-migration-sample-app-IdentityPool`,
      allowUnauthenticatedIdentities: false,
      authenticationProviders: {
        userPools: [new UserPoolAuthenticationProvider({ userPool, userPoolClient })],
      },
    });

    const getItemsHandler = new nodeLambda.NodejsFunction(this, 'GetItemsHandler', {
      functionName: `amplify-migration-sample-app-GetItemsHandler`,
      bundling: {
        externalModules: ['aws-sdk'],
      },
      runtime: lambda.Runtime.NODEJS_18_X,
      entry: 'lambda/getItemsHandler.ts',
    });

    const restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: `amplify-migration-sample-app-RestApi`,
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: ['GET'],
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });
    const itemsApi = restApi.root.addResource('items');
    const itemsApiMethod = itemsApi.addMethod('GET', new apigateway.LambdaIntegration(getItemsHandler), {
      authorizationType: apigateway.AuthorizationType.IAM,
    });
    identityPool.authenticatedRole.attachInlinePolicy(
      new iam.Policy(this, 'itemsApiAccess', {
        statements: [
          new iam.PolicyStatement({
            actions: ['execute-api:Invoke'],
            effect: iam.Effect.ALLOW,
            resources: [itemsApiMethod.methodArn],
          }),
        ],
      })
    );

    new cdk.CfnOutput(this, 'userPoolId', {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, 'userPoolClientId', {
      value: userPoolClient.userPoolClientId,
    });

    new cdk.CfnOutput(this, 'identityPoolId', {
      value: identityPool.identityPoolId,
    });
  }
}
