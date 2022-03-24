import boto3

client = boto3.client('cognito-idp')


def lambda_handler(event, context):
    # although we can auto-conform email at pre-signup phase,
    # but the user might use an illegal email (e.g. cannot receive the code)
    if event['request']['userAttributes'].get('email_verified') != 'true':
        client.admin_update_user_attributes(UserPoolId=event['userPoolId'],
                                            UserAttributes=[{
                                                'Name': 'email_verified',
                                                'Value': 'true',
                                            }],
                                            Username=event['userName'])

    return event
