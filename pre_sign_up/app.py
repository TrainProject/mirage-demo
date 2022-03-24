
# https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-pre-sign-up.html
def lambda_handler(event, context):
    event['response']['autoConfirmUser'] = True
    return event
