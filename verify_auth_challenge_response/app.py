
# https://docs.aws.amazon.com/cognito/latest/developerguide/user-pool-lambda-verify-auth-challenge-response.html

def lambda_handler(event, context):
    request = event['request']
    # the type of field request.challengeAnswer is not necessarily a dict,
    # the actual value is totally filled by client
    event['response']['answerCorrect'] = (
        request['privateChallengeParameters']['code'] ==
        request['challengeAnswer'])

    return event
