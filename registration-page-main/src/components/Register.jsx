import PropTypes from "prop-types";

import { EnvelopeIcon, LockClosedIcon, PhoneIcon, UserIcon } from "@heroicons/react/24/solid";

import { Button } from "./Button";
import { ContinueButtons } from "./ContinueButtons";
import { Divider } from "./Divider";
import { Input, Label } from "./Input";
import { ContainerLayout } from "./Layout";
import { useState } from "react";

export function Register({ changePage }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);

  // NEW: OTP states
  const [sendingOtp, setSendingOtp] = useState(false);
  const [resendSec, setResendSec] = useState(0);
  const [otpPreviewUrl, setOtpPreviewUrl] = useState("");

  const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:3000";

  async function handleSendOtp() {
    if (!email) {
      alert("Please enter email first.");
      return;
    }
    try {
      setSendingOtp(true);
      setOtpPreviewUrl("");
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setOtpPreviewUrl(data.previewUrl || "");
      // Start 60s resend timer
      setResendSec(60);
      const timer = setInterval(() => {
        setResendSec((s) => {
          if (s <= 1) {
            clearInterval(timer);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
      alert("OTP sent. Check your email" + (data.previewUrl ? " (preview URL available)." : "."));
    } catch (err) {
      console.error("Send OTP error:", err);
      alert(err.message || "Failed to send OTP");
    } finally {
      setSendingOtp(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    try {
      const payload = { username, password, email, phone, aadhaar, otp, acceptTerms };
      const response = await fetch(`${API_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (response.ok) {
        changePage()
        alert(data.message || "User registered successfully.");
      } else {
        alert(data.message || `Registration failed (${response.status}).`);
      }
    } catch (error) {
      console.error("Register error:", error);
      alert("Network error. Please make sure the server is running.");
    }
  }

  return (
    <ContainerLayout>
      <div className="mx-auto space-y-10 w-full max-w-sm lg:w-96">
        <div className="text-center lg:text-start">
          <img alt="Your Company" src="/primary-icon.svg" className="size-16 mx-auto lg:mx-0" />
          <h3 className="mt-8 text-2xl/9 font-bold tracking-tight text-gray-900">
            Create new account
          </h3>
        </div>

        <div className="space-y-6">
          <div>
            <form onSubmit={handleRegister} className="flex flex-col gap-y-6">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="your user name"
                  icon={UserIcon}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="youremail@example.com"
                  icon={EnvelopeIcon}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>


              <div>
                <Label htmlFor="password">New Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="1234"
                  icon={LockClosedIcon}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* <div>
                <Label htmlFor="aadhaar">Adhar Card Number</Label>
                <Input
                  id="aadhaar"
                  name="aadhaar"
                  type="number"
                  placeholder="1234-5678-9123"
                  icon={LockClosedIcon}
                  value={aadhaar}
                  onChange={(e) => setAadhaar(e.target.value)}
                />
              </div> */}
              <div>
                <Label htmlFor="phone">Phone number</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="123-456-7890"
                  icon={PhoneIcon}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                <Button
                  type="button"
                  className="mt-3 w-full"
                  onClick={handleSendOtp}
                  disabled={sendingOtp || !email || resendSec > 0}
                >
                  {sendingOtp ? "Sending..." : resendSec > 0 ? `Resend in ${resendSec}s` : "Send OTP"}
                </Button>
                {otpPreviewUrl ? (
                  <p className="mt-2 text-xs text-gray-600">
                    Email preview:{" "}
                    <a className="text-blue-600 underline" href={otpPreviewUrl} target="_blank" rel="noreferrer">
                      Open in browser
                    </a>
                  </p>
                ) : null}
              </div>

              <div>
                <Label htmlFor="otp"> OTP</Label>
                <Input
                  id="otp"
                  name="otp"
                  type="text"
                  placeholder="123456"
                  icon={LockClosedIcon}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <div>
                <div className="flex gap-3">
                  <div className="flex h-6 shrink-0 items-center">
                    <div className="group grid size-4 grid-cols-1">
                      <input
                        id="accept-terms"
                        name="accept-terms"
                        type="checkbox"
                        className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-blue-600 checked:bg-blue-600 indeterminate:border-green-600 indeterminate:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                        checked={acceptTerms}
                        onChange={(e) => setAcceptTerms(e.target.checked)}
                      />
                    </div>
                  </div>
                  <label
                    htmlFor="accept-terms"
                    className="block text-sm/6 font-medium text-gray-900"
                  >
                    I accept <a href="/" className="underline text-blue-600">Terms of Service and Privacy Policy</a>
                  </label>
                </div>
              </div>

              <div>
                <Button type="submit" variant="primary">Register</Button>
              </div>
            </form>
          </div>

        </div>
      </div>

      <div className="text-center">
        <p className="mt-6 text-sm/6 text-gray-500">
          Already have an account?{" "}
          <Button variant="text" onClick={changePage} className="px-0">
            Login
          </Button>
        </p>
      </div>
    </ContainerLayout>
  );
}

Register.propTypes = {
  changePage: PropTypes.func.isRequired
}
