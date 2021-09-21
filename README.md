# app-backend

## /api/v1 endpoints

| Route          |  Method  | Use case | Goal                           |
| -------------- | :------: | -------- | ------------------------------ |
| `/user`        |  `GET`   | RF1.6    | Query users                    |
| `/user`        |  `POST`  | RF1.1    | Register account               |
| `/user`        |  `PUT`   | RF1.5    | Modify own info                |
| `/user`        | `DELETE` | RF1.7    | Delete own account             |
| `/user/<id>`   |  `GET`   | RF1.3    | Get user info                  |
| `/user/<id>`   |  `PUT`   | RF1.4    | Modify a user's role           |
| `/session`     |  `GET`   | RF1.2    | Check session/get current user |
| `/session`     |  `POST`  | RF1.2    | Log in (start session)         |
| `/session`     |  `PUT`   | RF1.2    | Refresh session                |
| `/session`     | `DELETE` | RF1.2    | Log out (end session)          |
| `/report`      |  `GET`   | RF2.2    | Query reports                  |
| `/report`      |  `POST`  | RF2.1    | Create incident report         |
| `/report/<id>` |  `GET`   | RF2.3    | Get report info                |
| `/report/<id>` |  `PUT`   | RF2.5    | Modify report info             |

<!-- | `/report/stats` |  `GET`   | RF2.4    | Get report stats        | -->
