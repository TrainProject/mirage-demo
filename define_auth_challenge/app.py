# https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-define-auth-challenge.html


def fail(response):
    response['issueTokens'] = False
    response['failAuthentication'] = True


def ok(response):
    response['issueTokens'] = True
    response['failAuthentication'] = False


def challenge(response):
    response['issueTokens'] = False
    response['failAuthentication'] = False
    response['challengeName'] = 'CUSTOM_CHALLENGE'


def lambda_handler(event, context):
    session = event['request']['session']
    response = event['response']

    if not session:
        challenge(response)
    elif session[-1]['challengeName'] != 'CUSTOM_CHALLENGE':
        fail(response)
    elif session[-1]['challengeResult'] == True:
        ok(response)
    elif len(session) >= 3:
        fail(response)
    else:
        challenge(response)

    return event
