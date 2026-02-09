let todoData = [];

function showError(message) {
  // eslint-disable-next-line no-alert
  alert(message);
}

// 新增新的待辦事項
const inputText = document.querySelector('#inputText input');
const addButton = document.querySelector('#inputText button');
const todoListElement = document.querySelector('#list');
const workNumElement = document.querySelector('.todoList_statistics p');

let isCreating = false;
let currentStatus = 'all';

function setCreatingLoading(isLoading) {
  isCreating = isLoading;

  if (!addButton) return;

  addButton.disabled = isLoading;
  addButton.textContent = isLoading ? '處理中...' : '新增';
}

// render 渲染
function render() {
  let template = '';
  let pendingCount = 0;
  todoData.forEach((item, index) => {
    if (!item.checked) {
      pendingCount += 1;
    }

    if (currentStatus === 'pending' && item.checked) return;
    if (currentStatus === 'completed' && !item.checked) return;

    const isChecked = item.checked ? 'checked' : '';

    template += `<li>
                            <label class="todoList_label">
                                <input class="todoList_input" type="checkbox" ${isChecked} data-index="${index}" data-id="${item.id}">
                                <span>${item.content}</span>
                            </label>
                        <button type="button" data-index="${index}">
                            <i class="fa-solid fa-times" data-action="delete" data-id="${item.id}"></i>
                        </button>
                        </li>`;
  });
  todoListElement.innerHTML = template;

  if (workNumElement) {
    workNumElement.textContent = `${pendingCount} 個待完成項目`;
  }
}

function fetchTodos() {
  return fetch('http://localhost:3000/todos')
    .then((response) => response.json())
    .then((data) => {
      todoData = data.map((item) => ({
        id: item.id,
        content: item.content,
        completed: item.completed,
        checked: item.completed,
      }));
      render();
      return data;
    });
}

async function checkAuth() {
  const token = localStorage.getItem('token');

  if (!token) return false;

  try {
    const res = await fetch('https://todolist-api.hexschool.io/users/checkout', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token,
      },
    });

    if (!res.ok) {
      localStorage.removeItem('token');
      return false;
    }

    return true;
  } catch (err) {
    console.error(err);
    return false;
  }
}

// ⭐ Todo 頁面登入驗證
(async () => {
  const todoPage = document.querySelector('#todoListPage');
  if (!todoPage) return;

  const isAuthed = await checkAuth();

  if (!isAuthed) {
    // eslint-disable-next-line no-alert
    alert('登入已失效，請重新登入');
    window.location.href = '#loginPage';
    return;
  }

  fetchTodos().catch((error) => {
    console.error('API 發生錯誤', error);
    showError(
      '讀取失敗，請確認伺服器是否啟動（json-server / port 3000）',
    );
  });
})();

function createTodo(payload) {
  return fetch('http://localhost:3000/todos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function addItem(e) {
  e.preventDefault();
  if (isCreating) return;
  if (inputText.value.trim() === '') {
    return;
  }

  const payload = {
    content: inputText.value.trim(),
    completed: false,
  };

  setCreatingLoading(true);

  createTodo(payload)
    .then((res) => {
      if (!res.ok) throw new Error(`POST failed: ${res.status}`);
      inputText.value = '';
      return fetchTodos();
    })
    .then((data) => {
      todoData = data.map((item) => ({
        id: item.id,
        content: item.content,
        completed: item.completed,
        checked: item.completed,
      }));
      render();
    })
    .catch((err) => {
      console.error(err);
      showError('新增失敗，請確認伺服器是否啟動（json-server / port 3000）');
    })
    .finally(() => {
      setCreatingLoading(false);
    });
}

if (addButton) addButton.addEventListener('click', addItem);
// api delete

function patchTodo(id, payload) {
  return fetch(`http://localhost:3000/todos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

function deleteTodo(id) {
  return fetch(`http://localhost:3000/todos/${id}`, {
    method: 'DELETE',
  });
}

// 新增刪除功能

function handleListClick(e) {
  const deleteIcon = e.target.closest('[data-action="delete"]');
  const checkbox = e.target.closest('.todoList_input[data-id]');

  if (deleteIcon) {
    const { id } = deleteIcon.dataset;
    const target = todoData.find((t) => String(t.id) === String(id));

    if (!target) return;
    if (!target.checked) {
      return;
    }

    deleteTodo(id)
      .then((res) => {
        if (!res.ok) throw new Error(`DELETE failed: ${res.status}`);
        return fetchTodos();
      })
      .then((data) => {
        todoData = data.map((item) => ({
          id: item.id,
          content: item.content,
          completed: item.completed,
          checked: item.completed,
        }));
        render();
      })
      .catch((error) => {
        console.error('API 發生錯誤', error);
        showError('刪除失敗，請確認伺服器是否啟動（json-server / port 3000）');
      });

    return;
  }

  if (checkbox) {
    const { id } = checkbox.dataset;
    patchTodo(id, { completed: checkbox.checked })
      .then((res) => {
        if (!res.ok) throw new Error(`PATCH failed: ${res.status}`);
        return fetchTodos();
      })
      .then((data) => {
        todoData = data.map((item) => ({
          id: item.id,
          content: item.content,
          completed: item.completed,
          checked: item.completed,
        }));
        render();
      })

      .catch((err) => {
        console.error(err);
        showError(
          '更新狀態失敗，請確認伺服器是否啟動（json-server / port 3000）',
        );
      });
  }
}
if (todoListElement) todoListElement.addEventListener('click', handleListClick);

// 新增切換完成已完成標籤

const tabs = document.querySelectorAll('#todoListTab a');

if (tabs.length) {
  tabs.forEach((tab) => {
    tab.addEventListener('click', (e) => {
      const targetTab = e.target.closest('a');
      if (!targetTab) return;

      e.preventDefault();

      tabs.forEach((item) => item.classList.remove('active'));
      targetTab.classList.add('active');

      currentStatus = targetTab.getAttribute('data-status');
      render();
    });
  });
}

const signEmail = document.querySelector('#signEmail');
const signName = document.querySelector('#signName');
const signPwd = document.querySelector('#signPwd');
const checkPwd = document.querySelector('#checkPwd');
const signBtn = document.querySelector('#signBtn');

if (signBtn && signEmail && signName && signPwd && checkPwd) {
  signBtn.addEventListener('click', async () => {
    const email = signEmail.value.trim();
    const nickname = signName.value.trim();
    const password = signPwd.value.trim();
    const password2 = checkPwd.value.trim();

    if (!email || !nickname || !password || !password2) {
      alert('請完整填寫註冊資料');
      return;
    }

    if (password !== password2) {
      alert('兩次密碼不一致');
      return;
    }

    try {
      const res = await fetch('https://todolist-api.hexschool.io/users/sign_up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, nickname }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '註冊失敗');
        return;
      }

      alert('註冊成功，請登入');
      window.location.href = '#loginPage';
    } catch (err) {
      console.error(err);
      alert('系統錯誤，請稍後再試');
    }
  });
}

const loginEmail = document.querySelector('#loginEmail');
const loginPwd = document.querySelector('#loginPwd');
const loginBtn = document.querySelector('#loginBtn');

if (loginBtn && loginEmail && loginPwd) {
  loginBtn.addEventListener('click', async () => {
    const email = loginEmail.value.trim();
    const password = loginPwd.value.trim();
    if (!email || !password) {
      alert('請輸入完整登入資訊');
      return;
    }
    try {
      const res = await fetch('https://todolist-api.hexschool.io/users/sign_in', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || '登入失敗');
        return;
      }
      localStorage.setItem('token', data.token);

      window.location.href = '#todoListPage';
    } catch (err) {
      console.error(err);
      alert('登入錯誤，請稍後再試');
    }
  });
}

document.addEventListener('click', async (e) => {
  const btn = e.target.closest('#logoutBtn');
  if (!btn) return;

  const token = localStorage.getItem('token');

  try {
    await fetch('https://todolist-api.hexschool.io/users/sign_out', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: token || '',
      },
    });
  } catch (err) {
    console.error(err);
  } finally {
    localStorage.removeItem('token');
    window.location.href = '#loginPage';
  }
});
