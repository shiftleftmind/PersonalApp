import { Router, Request, Response } from 'express';

const router = Router();

// Sandbox Index
router.get('/', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>QA Automation Challenge Sandbox</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
          a { color: #818cf8; text-decoration: none; display: block; margin: 0.5rem 0; font-size: 1.1rem; }
          a:hover { text-decoration: underline; }
          .card { background: #1e293b; padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <h1>Playwright QA Sandbox Target Pages</h1>
        <p>Use these local pages to practice Playwright test scripts, locators, and assertions.</p>
        <div class="card">
          <a href="/sandbox/async">1. Asynchronous Delayed Elements & Spinners</a>
          <a href="/sandbox/forms">2. Form Validation & Controls</a>
          <a href="/sandbox/shadow-dom">3. Shadow DOM & Custom Web Components</a>
          <a href="/sandbox/iframe">4. Nested Iframe Interactivity</a>
          <a href="/sandbox/auth">5. Authentication Flow & Session Management</a>
          <a href="/sandbox/upload">6. File Drag-and-Drop & Upload</a>
          <a href="/sandbox/popups">7. Dialogs, Alerts & Multi-Window Popups</a>
        </div>
      </body>
    </html>
  `);
});

// 1. Async Sandbox Page
router.get('/async', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Async Loading Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
          button { background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
          .spinner { display: inline-block; width: 24px; height: 24px; border: 3px solid rgba(255,255,255,.3); border-radius: 50%; border-top-color: #fff; animation: spin 1s ease-in-out infinite; margin-top: 1rem; }
          @keyframes spin { to { transform: rotate(360deg); } }
          table { width: 100%; border-collapse: collapse; margin-top: 1rem; }
          th, td { border: 1px solid #334155; padding: 8px; text-align: left; }
          th { background: #1e293b; }
        </style>
      </head>
      <body>
        <h2>Async Delayed Loading Challenge</h2>
        <p>Click the button below. A spinner will appear, and after 2 seconds the results table will load.</p>
        <button id="load-btn" data-testid="load-button">Load German Tech Jobs</button>
        <div id="loader-container"></div>
        <div id="content-container"></div>

        <script>
          document.getElementById('load-btn').addEventListener('click', () => {
            const container = document.getElementById('loader-container');
            container.innerHTML = '<div class="spinner" data-testid="loading-spinner"></div><p id="loading-text">Fetching live data from Berlin tech boards...</p>';
            document.getElementById('content-container').innerHTML = '';

            setTimeout(() => {
              container.innerHTML = '';
              document.getElementById('content-container').innerHTML = \`
                <table id="jobs-table" data-testid="jobs-table">
                  <thead>
                    <tr><th>Role</th><th>Company</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    <tr><td>Senior QA Automation</td><td>Zalando</td><td class="badge">Open</td></tr>
                    <tr><td>Playwright Test Engineer</td><td>N26</td><td class="badge">Open</td></tr>
                    <tr><td>SDET Lead</td><td>Delivery Hero</td><td class="badge">Open</td></tr>
                  </tbody>
                </table>
                <p id="status-message" data-testid="success-message">Successfully loaded 3 jobs!</p>
              \`;
            }, 2000);
          });
        </script>
      </body>
    </html>
  `);
});

// 2. Forms Sandbox Page
router.get('/forms', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Form Validation Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 600px; }
          label { display: block; margin-top: 1rem; font-weight: 600; }
          input, select { width: 100%; padding: 8px; margin-top: 4px; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; }
          button { background: #10b981; color: white; border: none; padding: 10px 20px; border-radius: 4px; margin-top: 1.5rem; cursor: pointer; font-weight: bold; }
          .error { color: #ef4444; font-size: 0.85rem; margin-top: 4px; display: none; }
          .success { color: #10b981; font-weight: bold; margin-top: 1rem; }
        </style>
      </head>
      <body>
        <h2>QA Application Form Challenge</h2>
        <form id="qa-form">
          <label for="name">Candidate Name:</label>
          <input type="text" id="name" name="name" required />
          <div id="name-error" class="error">Name must be at least 3 characters</div>

          <label for="email">Email Address:</label>
          <input type="email" id="email" name="email" required />

          <label for="experience">Experience Level:</label>
          <select id="experience" name="experience">
            <option value="junior">Junior QA (<2 years)</option>
            <option value="mid">Mid-level QA (2-4 years)</option>
            <option value="senior" selected>Senior Automation Engineer (4+ years)</option>
          </select>

          <label for="german-level">German Proficiency:</label>
          <select id="german-level" name="german-level">
            <option value="A1">A1 Beginner</option>
            <option value="A2">A2 Elementary</option>
            <option value="B1">B1 Intermediate</option>
            <option value="B2">B2 Fluent</option>
          </select>

          <button type="submit" id="submit-btn" role="button">Submit Application</button>
        </form>
        <div id="result-message"></div>

        <script>
          document.getElementById('qa-form').addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            if (name.length < 3) {
              document.getElementById('name-error').style.display = 'block';
              return;
            }
            document.getElementById('name-error').style.display = 'none';
            document.getElementById('result-message').innerHTML = '<p class="success" data-testid="form-success">Application submitted successfully for ' + name + '!</p>';
          });
        </script>
      </body>
    </html>
  `);
});

// 3. Shadow DOM Page
router.get('/shadow-dom', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Shadow DOM Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
        </style>
      </head>
      <body>
        <h2>Shadow DOM Challenge</h2>
        <p>Testing inside Open Shadow Roots.</p>
        <qa-custom-widget></qa-custom-widget>

        <script>
          class QaWidget extends HTMLElement {
            connectedCallback() {
              const shadow = this.attachShadow({ mode: 'open' });
              shadow.innerHTML = \`
                <style>
                  .box { background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #475569; color: #f1f5f9; }
                  button { background: #f59e0b; color: black; font-weight: bold; padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; }
                </style>
                <div class="box">
                  <h3>Shadow DOM Component</h3>
                  <p id="shadow-text">Current Status: Idle</p>
                  <button id="shadow-action-btn">Trigger Automation Action</button>
                </div>
              \`;
              shadow.getElementById('shadow-action-btn').addEventListener('click', () => {
                shadow.getElementById('shadow-text').innerText = 'Current Status: Automation Completed!';
              });
            }
          }
          customElements.define('qa-custom-widget', QaWidget);
        </script>
      </body>
    </html>
  `);
});

// 4. Iframe Page
router.get('/iframe', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Iframe Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
          iframe { width: 100%; height: 300px; border: 2px solid #6366f1; border-radius: 8px; background: #1e293b; }
        </style>
      </head>
      <body>
        <h2>Nested Iframe Challenge</h2>
        <p>Playwright's <code>frameLocator()</code> handles switching into this context effortlessly.</p>
        <iframe srcdoc="
          <!DOCTYPE html>
          <html>
            <body style='font-family: system-ui; color: white; padding: 1rem;'>
              <h3>Inside Nested Iframe</h3>
              <input type='text' id='iframe-input' placeholder='Type test notes...' style='padding: 8px; border-radius: 4px;' />
              <button id='iframe-btn' style='background: #6366f1; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer;' onclick='document.getElementById(&quot;iframe-status&quot;).innerText = &quot;Confirmed: &quot; + document.getElementById(&quot;iframe-input&quot;).value'>Save</button>
              <p id='iframe-status'></p>
            </body>
          </html>
        "></iframe>
      </body>
    </html>
  `);
});

// 5. Auth Page
router.get('/auth', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Auth Flow Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 450px; }
          input { width: 100%; padding: 8px; margin: 8px 0; border-radius: 4px; border: 1px solid #334155; background: #1e293b; color: white; }
          button { background: #6366f1; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; width: 100%; font-weight: bold; margin-top: 8px; }
          .error { color: #ef4444; margin-top: 8px; }
          .dashboard { background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; display: none; }
        </style>
      </head>
      <body>
        <h2>QA Portal Login</h2>
        <div id="login-box">
          <label>Username (use: <code>testuser</code>):</label>
          <input type="text" id="username" aria-label="Username" />
          <label>Password (use: <code>password123</code>):</label>
          <input type="password" id="password" aria-label="Password" />
          <button id="login-btn" role="button">Log In</button>
          <div id="error-msg" class="error"></div>
        </div>
        <div id="dashboard-box" class="dashboard">
          <h3>Welcome, Test Engineer!</h3>
          <p id="auth-token-badge">Session Token: active_qa_session_98234</p>
          <button id="logout-btn" style="background: #ef4444;">Log Out</button>
        </div>

        <script>
          document.getElementById('login-btn').addEventListener('click', () => {
            const u = document.getElementById('username').value;
            const p = document.getElementById('password').value;
            if (u === 'testuser' && p === 'password123') {
              document.getElementById('login-box').style.display = 'none';
              document.getElementById('dashboard-box').style.display = 'block';
              document.getElementById('error-msg').innerText = '';
            } else {
              document.getElementById('error-msg').innerText = 'Invalid credentials. Please try again.';
            }
          });

          document.getElementById('logout-btn').addEventListener('click', () => {
            document.getElementById('login-box').style.display = 'block';
            document.getElementById('dashboard-box').style.display = 'none';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
          });
        </script>
      </body>
    </html>
  `);
});

// 6. File Drag-and-Drop & Upload Page
router.get('/upload', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>File Upload & Drag Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 600px; }
          .dropzone { border: 2px dashed #6366f1; border-radius: 12px; padding: 2.5rem; text-align: center; background: #1e293b; cursor: pointer; transition: 0.2s; }
          .dropzone.dragover { background: #312e81; border-color: #a5b4fc; }
          input[type=file] { display: none; }
          .success { color: #10b981; font-weight: bold; margin-top: 1rem; }
          .info { background: #0f172a; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <h2>File Drag-and-Drop &amp; Upload Challenge</h2>
        <p>Practice automated file uploads using Playwright's <code>setInputFiles()</code>.</p>
        
        <div id="dropzone" class="dropzone" data-testid="dropzone-area">
          <p>Drag and drop a file here, or click to browse</p>
          <input type="file" id="file-input" data-testid="file-upload-input" />
        </div>

        <div id="upload-status" class="info" style="display:none;" data-testid="upload-status">
          <p class="success">Upload Successful!</p>
          <p>File Name: <span id="file-name" data-testid="uploaded-file-name"></span></p>
          <p>File Size: <span id="file-size" data-testid="uploaded-file-size"></span> bytes</p>
        </div>

        <script>
          const dropzone = document.getElementById('dropzone');
          const fileInput = document.getElementById('file-input');
          const statusBox = document.getElementById('upload-status');
          const fileName = document.getElementById('file-name');
          const fileSize = document.getElementById('file-size');

          dropzone.addEventListener('click', () => fileInput.click());

          dropzone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropzone.classList.add('dragover');
          });

          dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));

          dropzone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length) {
              fileInput.files = e.dataTransfer.files;
              displayFile(e.dataTransfer.files[0]);
            }
          });

          fileInput.addEventListener('change', () => {
            if (fileInput.files.length) {
              displayFile(fileInput.files[0]);
            }
          });

          function displayFile(file) {
            fileName.textContent = file.name;
            fileSize.textContent = file.size;
            statusBox.style.display = 'block';
          }
        </script>
      </body>
    </html>
  `);
});

// 7. Popups, Alerts & Multi-Window Page
router.get('/popups', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Popups & Alerts Challenge</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; max-width: 600px; }
          button { background: #6366f1; color: white; border: none; padding: 10px 18px; border-radius: 6px; cursor: pointer; font-weight: 600; margin-right: 0.5rem; margin-bottom: 0.5rem; }
          button:hover { background: #4f46e5; }
          .result-card { background: #1e293b; padding: 1rem; border-radius: 8px; margin-top: 1rem; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <h2>Dialogs, Alerts &amp; Multi-Window Popups</h2>
        <p>Practice handling browser <code>dialog</code> events and <code>page.waitForEvent('popup')</code>.</p>

        <div style="margin-top: 1.5rem;">
          <button id="alert-btn" data-testid="trigger-alert-btn">Trigger Alert</button>
          <button id="confirm-btn" data-testid="trigger-confirm-btn">Trigger Confirm</button>
          <button id="popup-btn" data-testid="open-popup-btn">Open New Window</button>
        </div>

        <div class="result-card">
          <p>Dialog Result: <span id="dialog-result" data-testid="dialog-result">None</span></p>
        </div>

        <script>
          document.getElementById('alert-btn').addEventListener('click', () => {
            window.alert('QA Alert: Regression Test Started');
            document.getElementById('dialog-result').innerText = 'Alert was accepted';
          });

          document.getElementById('confirm-btn').addEventListener('click', () => {
            const confirmed = window.confirm('Do you approve the test deployment to production?');
            document.getElementById('dialog-result').innerText = confirmed ? 'Confirm Accepted: YES' : 'Confirm Dismissed: NO';
          });

          document.getElementById('popup-btn').addEventListener('click', () => {
            window.open('/sandbox/popup-child', 'QAPopupWindow', 'width=500,height=400');
          });
        </script>
      </body>
    </html>
  `);
});

// Child page for popup testing
router.get('/popup-child', (req: Request, res: Response) => {
  res.send(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Child Window</title>
        <style>
          body { font-family: system-ui; background: #0f172a; color: #f8fafc; padding: 2rem; }
          .box { background: #1e293b; padding: 1.5rem; border-radius: 8px; border: 1px solid #334155; }
        </style>
      </head>
      <body>
        <div class="box">
          <h2 data-testid="popup-child-heading">Child Window Target</h2>
          <p data-testid="popup-child-text">This window was opened as a separate popup by the parent test page.</p>
          <button onclick="window.close()" style="background:#ef4444; color:white; border:none; padding:8px 16px; border-radius:4px; cursor:pointer;">Close Window</button>
        </div>
      </body>
    </html>
  `);
});

export default router;
