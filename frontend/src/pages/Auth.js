import React from "react";
import "./Auth.css";

const { useCallback, createRef, useState } = React;

const Auth = (props) => {
  const [isLogin, setIsLogin] = useState(true);

  const emailEl = createRef();
  const passwordEl = createRef();

  const switchModeHandler = useCallback(() => {
    setIsLogin((prevState) => !prevState);
  }, [setIsLogin]);

  const submitHandler = useCallback(
    (e) => {
      e.preventDefault();
      const email = emailEl.current.value;
      const password = passwordEl.current.value;

      if (email.trim().length === 0 || password.trim().length === 0) {
        return;
      }

      let requestBody = {
        query: `
          query {
            login(email: "${email}", password:"${password}") {
              userId
              token
              tokenExpiration
            }
          }
        `,
      };

      if (!isLogin) {
        requestBody = {
          query: `
          mutation {
            createUser(userInput: {email: "${email}", password:"${password}"}) {
              _id
              email
            }
          }
        `,
        };
      }

      fetch("http://localhost:3500/graphql", {
        method: "POST",
        body: JSON.stringify(requestBody),
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((res) => {
          if (res.status !== 200 && res.status !== 201) {
            throw new Error("Failed");
          }
          return res.json();
        })
        .then((resData) => {
          console.log(resData);
        })
        .catch((err) => {
          console.log(err);
        });
    },
    [emailEl, passwordEl, isLogin]
  );

  return (
    <form className="auth-form" onSubmit={submitHandler}>
      <div className="form-control">
        <label htmlFor="email">E-Mail</label>
        <input type="email" id="email" ref={emailEl} />
      </div>
      <div className="form-control">
        <label htmlFor="password">Password</label>
        <input type="password" id="password" ref={passwordEl} />
      </div>
      <div className="form-actions">
        <button type="submit">Submit</button>
        <button type="button" onClick={switchModeHandler}>
          Switch to {isLogin ? "Signup" : "Login"}
        </button>
      </div>
    </form>
  );
};

export default Auth;
