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

### /user querying parameters

| Parameter | Goal                                               | Default |
| --------- | -------------------------------------------------- | ------- |
| `name`    | Partial search text of user's first and last names | Any     |
| `skip`    | Number of users to skip on the search              | None    |

### /report querying parameters

| Parameter  | Goal                                              | Default                                      |
| ---------- | ------------------------------------------------- | -------------------------------------------- |
| `status`   | Filter by current status                          | Any                                          |
| `category` | Filter by category                                | Any                                          |
| `creator`  | Filter by creator's user ID                       | Admin - Any<br />Visitor - Own ID (enforced) |
| `from`     | Filter by lower limit of creationDate (inclusive) | Any                                          |
| `to`       | Filter by pper limit of creationDate (exclusive)  | Current date                                 |
| `limit`    | Number of results returned                        | Defined max possible results                 |

## Role numbers/permission levels

| Number | Role    |
| ------ | ------- |
| `0`    | Root    |
| `1`    | Admin   |
| `2`    | Visitor |

## Category numbers

| Number | Category          |
| ------ | ----------------- |
| `0`    | Other             |
| `1`    | Luminary          |
| `2`    | Dog Feces         |
| `3`    | Branches          |
| `4`    | Overgrown Grass   |
| `5`    | Facilities Fault  |
| `6`    | Leashless Dog     |
| `7`    | Garbage           |
| `8`    | Facilities Misuse |

