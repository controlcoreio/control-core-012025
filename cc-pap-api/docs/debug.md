### Check if policies are loaded properly into OPA

```
curl http://localhost:8181/v1/policies
```
### Github token error

- Make sure to create a Github token within your Git Policies Git repo that gives all read/write access.
- Then `export GITHUB_TOKEN=xyz123`
