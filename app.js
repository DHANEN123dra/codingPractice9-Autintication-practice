const express = require('express')
const sqlite3 = require('sqlite3')
const {open} = require('sqlite')
const bcrypt = require('bcrypt')
const path = require('path')
const dbPath = path.join(__dirname, 'userData.db')
const app = express()
app.use(express.json())

let db = null

const intilizeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })

    app.listen(3000, () => {
      console.log('Server is Running Sucessfully')
    })
  } catch (error) {
    console.log(`Db Error:${error.message}`)
    process.exit(1)
  }
}
intilizeDbAndServer()

//POST API 1
app.post('/register', async (request, response) => {
  const {username, name, password, gender, location} = request.body
  const hashedPassword = await bcrypt.hash(password, 10)
  const userQuery = `
    SELECT
      *
    FROM
     user
    WHERE
     username = '${username}';`

  const userDb = await db.get(userQuery)

  if (userDb === undefined) {
    const createdUserQuery = `INSERT INTO 
         user(username,name,password,gender,location)
        VALUES
        ('${username}',
         '${name}',
         '${password}',
         '${gender}',
         '${location}');`

    if (password.length > 4) {
      await db.run(createdUserQuery)
      response.status(200)
      response.send('User created successfully')
    } else {
      response.status(400)
      response.send('Password is too short')
    }
  } else {
    response.status(400)
    response.send('User already exists')
  }
})

//POST API 2
app.post('/login', async (request, response) => {
  const {username, password} = request.body
  const getLoginCredentials = `
  SELECT
    *
  FROM
   user
  WHERE
   username = '${username}';`
  const userLoginDb = await db.get(getLoginCredentials)

  if (userLoginDb === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatched = await bcrypt.compare(
      password,
      userLoginDb.password,
    )

    if (isPasswordMatched === true) {
      response.status(200)
      response.send('Login success!')
    } else {
      response.status(400)
      response.send('Invalid password')
    }
  }
})

//PUT API 3

app.put('/change-password', async (request, response) => {
  const {username, oldPassword, newPassword} = request.body
  const userDetailesForPasswordChange = `
  SELECT
    *
  FROM
   user
  WHERE
   username = '${username}';`

  const passwordDb = await db.get(userDetailesForPasswordChange)

  if (passwordDb === undefined) {
    response.status(400)
    response.send('Invalid user')
  } else {
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      passwordDb.password,
    )

    if (isPasswordMatch === true) {
      if (newPassword.length > 4) {
        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const updatedPassword = `UPDATE
          user
         SET
          password = '${hashedPassword};'
        WHERE
         username = '${username}';`
        const user = await db.run(updatedPassword)
        response.status(200)
        response.send('Password updated')
      } else {
        response.status(400)
        response.send('Password is too short')
      }
    } else {
      response.status(400)
      response.send('Invalid current password')
    }
  }
})
module.exports = app
