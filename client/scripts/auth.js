document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("loginForm");
    const registerForm = document.getElementById("registerForm");

    // Login form handler
    if (loginForm) {
        loginForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                const email = document.getElementById("email").value.trim();
                const password = document.getElementById("password").value;

                if (!email || !password) {
                    throw new Error('Vui lòng điền đầy đủ thông tin');
                }

                const response = await fetch("http://localhost:5000/api/auth/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email, password }),
                    credentials: "include",
                });

                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Đăng nhập thất bại');
                }

                localStorage.setItem("token", data.token);
                window.location.href = "/";
            } catch (error) {
                console.error("Error:", error);
                alert(error.message);
            } finally {
                submitBtn.disabled = false;
            }
        });
    }

    // Register form handler
    if (registerForm) {
      registerForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const submitBtn = registerForm.querySelector('button[type="submit"]');
          submitBtn.disabled = true;
  
          try {
              const username = document.getElementById("username").value.trim();
              const email = document.getElementById("email").value.trim();
              const password = document.getElementById("password").value;
  
              // Enhanced validation
              if (!username || !email || !password) {
                  throw new Error('Vui lòng điền đầy đủ thông tin');
              }
  
              if (password.length < 6) {
                  throw new Error('Mật khẩu phải có ít nhất 6 ký tự');
              }
  
              if (!email.includes('@')) {
                  throw new Error('Email không hợp lệ');
              }
  
              // Log request data for debugging
              console.log('Register request:', { username, email });
  
              const response = await fetch('http://localhost:5000/api/auth/register', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                      username,
                      email,
                      password
                  })
              });
  
              const data = await response.json();
              console.log('Server response:', data);
  
              if (!response.ok) {
                  throw new Error(data.message || 'Registration failed');
              }
  
              localStorage.setItem('token', data.token);
              alert('Đăng ký thành công!');
              registerForm.reset();
              window.location.href = '/pages/login.html';
  
          } catch (error) {
              console.error('Register error:', error);
              alert(error.message || 'Đăng ký thất bại, vui lòng thử lại');
          } finally {
              submitBtn.disabled = false;
          }
      });
  }
});