import string
import secrets
import boto3
import os

client = boto3.client('ses')
challenge_meta_data_prefix = 'CODE-'

# https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-create-auth-challenge.html


def send_email(email_address: str, code: str):
    client.send_email(
        Destination={'ToAddresses': [email_address]},
        Message={
            'Body': {
                'Html': {
                    'Charset': 'UTF-8',
                    'Data': f"""
<html>
<body>
 <p>This is your secret login code: </p>
 <h3>{code}</h3>
</body>
</html>""",
                },
                'Text': {
                    'Charset': 'UTF-8',
                    'Data': f'Your secret login code: {code}',
                }
            },
            'Subject': {
                'Charset': 'UTF-8',
                'Data': 'Your secret login code'
            }
        },
        Source=os.environ.get('SES_FROM_ADDRESS'),
    )


def lambda_handler(event, context):
    request = event['request']
    session = request.get('session')
    email_address = request['userAttributes']['email']

    if not session:
        code = ''.join(secrets.choice(string.digits) for i in range(6))
        send_email(email_address, code)
    else:
        # reuse session allows typing error for the secret code
        code = session[-1]['challengeMetadata'][len(
            challenge_meta_data_prefix):]

    event['response'] = {
        'publicChallengeParameters': {
            'email': email_address
        },
        'privateChallengeParameters': {
            'code': code,
        },
        'challengeMetadata': f'{challenge_meta_data_prefix}{code}',
    }

    return event
