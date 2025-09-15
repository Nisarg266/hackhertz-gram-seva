import PropTypes from "prop-types";

import { EnvelopeIcon, LockClosedIcon } from "@heroicons/react/24/solid";

import { Button } from "./Button";
import { ContinueButtons } from "./ContinueButtons";
import { Divider } from "./Divider";
import { Input, Label } from "./Input";
import { ContainerLayout } from "./Layout";
import { useState } from "react";


export function Login({ changePage, onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000";
    try {
      console.log("Logging in with", { email, password });
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Server expects { username, password }. We use email as the username field.
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        // onLoginSuccess(data.role); // Pass the role to the handler
        window.location.href = "http://localhost:8080/";
        // alert(data.message || "Login successful.");
      } else {
        alert(data.message || `Login failed (${response.status}).`);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Network error. Please make sure the server is running.");
    }
  }

  return (
    <ContainerLayout reverse={true}>
      <div className="mx-auto space-y-10 w-full max-w-sm lg:w-100 h-full">
        <div>
          <img alt="Your Company" src="/primary-icon.svg" className="size-16" />
          <h3 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h3>
        </div>

        <div className="space-y-6">
          <div>
            <form onSubmit={handleLogin} className="flex flex-col gap-y-6">
              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="youremail@example.com"
                  icon={EnvelopeIcon}
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="1234"
                  icon={LockClosedIcon}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
              <input
                        id="remember-me"
                        name="remember-me"
                        type="checkbox"
                className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 indeterminate:border-green-600 indeterminate:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                      />
                    </div>
                  </div>
                  <label
                    htmlFor="remember-me"
                    className="block text-sm/6 text-gray-900"
                  >
                    Remember me
                  </label>
                </div>

                <div className="text-sm/6">
                  <a
                    href="/"
                      className="font-semibold text-blue-600 hover:text-green-500"
                  >
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <Button type="submit" variant="primary">Sign in</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className="text-center">
        <p className="mt-2 text-sm/10 text-gray-500">
          Don{"'"}t have an account yet?{" "}
          <Button variant="text" onClick={changePage} className="px-0">
            Create a new account
          </Button>
        </p>
      </div>
    </ContainerLayout>
  );
}

Login.propTypes = {
  changePage: PropTypes.func.isRequired,
  onLoginSuccess: PropTypes.func.isRequired,
}