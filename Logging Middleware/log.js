import axios from "axios";

const LOG_SERVER_URL = "http://20.244.56.144/evaluation-service/logs";

const Logger = async (stack, level, packageName, message) => {
  const payload = {
    stack,
    level,
    package: packageName,
    message,
  };

  try {
    const { data } = await axios.post(LOG_SERVER_URL, payload, {
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    console.log(`Log Created [${level.toUpperCase()}]:`, data);
    return data;
  } 
  catch(err) {
    console.error("Failed to send log:", err.message);
    return null;
  }
}

export default Logger;
