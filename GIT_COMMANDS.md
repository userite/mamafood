# 📝 Git команди - Стъпка по стъпка

## 🚀 СТЪПКА 1: Инициализирай Git (ако още не е направено)

```powershell
cd C:\~ip\app-dblib\cursor_projects\Gabi_and_Kai
git init
```

---

## 🔗 СТЪПКА 2: Свържи с GitHub Repository

```powershell
git remote add origin https://github.com/userite/mamafood.git
```

**Ако вече има remote:**
```powershell
git remote set-url origin https://github.com/userite/mamafood.git
```

**Провери remote:**
```powershell
git remote -v
```

---

## 📁 СТЪПКА 3: Добави всички файлове

```powershell
git add .
```

**Или да добавиш конкретни файлове:**
```powershell
git add backend-only/server_pg.js
git add backend-only/package_pg.json
git add database_setup_pg.sql
```

---

## 💾 СТЪПКА 4: Направи commit

```powershell
git commit -m "Add PostgreSQL version for Render.com"
```

**Или по-описателно:**
```powershell
git commit -m "Add PostgreSQL support: server_pg.js, package_pg.json, database_setup_pg.sql"
```

---

## 🚀 СТЪПКА 5: Качи в GitHub

```powershell
git branch -M main
git push -u origin main
```

**Ако вече има main branch:**
```powershell
git push origin main
```

---

## 🔄 За следващите промени (бързо)

```powershell
git add .
git commit -m "Описание на промяната"
git push
```

---

## 📋 Пълна поредица (копирай и изпълни)

```powershell
# 1. Отиди в папката
cd C:\~ip\app-dblib\cursor_projects\Gabi_and_Kai

# 2. Провери статус
git status

# 3. Ако няма Git, инициализирай
git init

# 4. Свържи с GitHub (ако не е свързано)
git remote add origin https://github.com/userite/mamafood.git

# 5. Добави файлове
git add .

# 6. Commit
git commit -m "Add PostgreSQL version and new files"

# 7. Качи в GitHub
git branch -M main
git push -u origin main
```

---

## ⚠️ Ако има проблеми

### "Authentication failed"
- Използвай **Personal Access Token** вместо парола
- Създай тук: https://github.com/settings/tokens

### "Repository not found"
- Провери дали repository-то съществува: https://github.com/userite/mamafood
- Провери дали имаш права за write

### "Branch 'main' already exists"
```powershell
git pull origin main --allow-unrelated-histories
git push origin main
```

---

## ✅ Готово!

След успешен push, отиди на:
**https://github.com/userite/mamafood**

Трябва да видиш всички файлове! 🎉

