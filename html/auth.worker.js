import "./modules/amazon-cognito-identity.js";
import { KVStorage } from "./storage.js";

const {
  CognitoUser,
  CognitoUserPool,
  CognitoUserAttribute,
  AuthenticationDetails,
} = AmazonCognitoIdentity;

const poolData = {
  UserPoolId: "ap-northeast-1_jfNT6Bvq1",
  ClientId: "4a5d9bcj660b5l9v2hc7i2267i",
};

const userPool = new CognitoUserPool(poolData);
// map of username->{ user: CognitoUser, session: CognitoUserSession }
const cognitoUsers = {};

function getRandomString(bytes) {
  const randomValues = new Uint8Array(bytes);
  window.crypto.getRandomValues(randomValues);
  return Array.from(randomValues).map(intToHex).join("");
}

function intToHex(nr) {
  return nr.toString(16).padStart(2, "0");
}

function authCallbacks(user, resolve, reject) {
  return {
    onSuccess: async (session) => {
      console.debug(session);
      await user.storage.sync();
      resolve({ user, session });
    },
    onFailure: (err) => {
      console.debug(err);
      reject(err);
    },
    customChallenge: (challengeParam) => {
      console.debug("custom challenge answer required");
      user["challengeName"] = "CUSTOM_CHALLENGE";
      user["challengeParam"] = challengeParam;
      resolve({ user });
    },
  };
}

async function signIn(username) {
  const user = new CognitoUser({
    Username: username,
    Pool: userPool,
    Storage: new KVStorage(),
  });
  user.setAuthenticationFlowType("CUSTOM_AUTH");

  const authDetails = new AuthenticationDetails({
    Username: username,
  });

  return new Promise((resolve, reject) => {
    user.initiateAuth(authDetails, authCallbacks(user, resolve, reject));
  });
}

async function signUp(email) {
  const attr = new CognitoUserAttribute({
    Name: "email",
    Value: email,
  });

  return new Promise((resolve, reject) => {
    userPool.signUp(email, getRandomString(30), [attr], null, (err, result) => {
      if (err) {
        console.debug("signUp failure", err);
        reject(err);
      } else {
        console.debug("signUp success", result);
        resolve(result.user);
      }
    });
  });
}

async function signOut(username) {
  const value = cognitoUsers[username];
  if (!value) {
    throw new Error(`required sign-in first: ${username}`);
  }

  const { user } = value;
  user.signOut();
  await user.storage.sync();
}

async function answerChallenge(username, challengeResponses) {
  const value = cognitoUsers[username];
  if (!value) {
    throw new Error(`unknown username: ${username}`);
  }

  if (!challengeResponses) {
    throw new Error("challengeResponses is required");
  }

  const { user } = value;
  return new Promise((resolve, reject) => {
    user.sendCustomChallengeAnswer(
      challengeResponses,
      authCallbacks(user, resolve, reject)
    );
  });
}

async function sendCode(email) {
  try {
    return await signIn(email);
  } catch (error) {
    switch (error.code) {
      case "UserNotFoundException":
        console.debug("signUp automatically");
        const { username } = await signUp(email);
        return await signIn(username);
      default:
        throw error;
    }
  }
}

async function verifyCode(username, code) {
  const result = await answerChallenge(username, code);
  if (!result.session) {
    throw new Error("wrong code");
  }
  return result;
}

async function getUserAttributes(username) {
  const value = cognitoUsers[username];
  if (!value) {
    throw new Error(`required sign-in first: ${username}`);
  }
  const { user } = value;
  return new Promise((resolve, reject) => {
    user.getUserAttributes((err, attributes) => {
      if (err) {
        reject(err);
      } else {
        resolve(attributes);
      }
    });
  });
}

onmessage = async ({ data }) => {
  console.debug("Message received from main script", data);
  try {
    const type = data.type;
    switch (type) {
      case "send-code":
        {
          const result = await sendCode(data.email);
          const username = result.user.username;
          cognitoUsers[username] = result;
          postMessage({ state: "sign-in", type: "verify-code", username });
        }
        break;
      case "verify-code":
        {
          const { username, code } = data;
          cognitoUsers[username] = await verifyCode(username, code);
          postMessage({ state: "signed-in", type, username });
        }
        break;
      case "get-user-attributes":
        {
          const { username } = data;
          const attrs = await getUserAttributes(username);
          postMessage({ state: "signed-in", type, username, attrs });
        }
        break;
      case "sign-out":
        {
          const { username } = data;
          await signOut(username);
          postMessage({ state: "signed-out", type, username });
        }
        break;
      default:
        throw new Error(`unknown message: ${data}`);
    }
  } catch (error) {
    postMessage({ ...data, error });
  }
};
