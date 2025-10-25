# 项目清理脚本使用说明

## 功能概述

`cleanup.sh` 是一个智能的项目清理脚本，可以：

1. **停止前后端服务**：自动检测并停止正在运行的 Node.js 服务
2. **清理项目文件**：删除除指定保留文件外的所有文件和目录
3. **可配置保留列表**：支持通过配置文件或命令行参数自定义保留的文件
4. **安全机制**：提供预览模式和确认机制，防止误删

## 基本用法

### 1. 预览模式（推荐首次使用）
```bash
./cleanup.sh --dry-run
```
这会显示将要删除的文件，但不会实际删除。

### 2. 正常清理（需要确认）
```bash
./cleanup.sh
```
会显示确认信息，需要输入 `y` 确认后执行。

### 3. 跳过确认直接执行
```bash
./cleanup.sh -y
```
⚠️ **警告**：这会直接删除文件，请谨慎使用！

## 高级用法

### 查看当前保留列表
```bash
./cleanup.sh --list
```

### 临时保留额外文件
```bash
./cleanup.sh -k package.json -k README.md --dry-run
```

### 使用自定义配置文件
```bash
./cleanup.sh -c my-custom.config
```

## 配置文件

### 默认配置文件：`cleanup.config`

当前默认保留的文件和目录：
- `images/` - 图片目录
- `system_prompt/` - 系统提示目录
- `.gitignore` - Git 忽略文件
- `requirement_new.md` - 需求文档
- `user_prompt.txt` - 用户提示文件
- `.git/` - Git 仓库
- `cleanup.sh` - 脚本自身
- `cleanup.config` - 配置文件

### 自定义配置文件格式

创建一个文本文件，每行一个要保留的文件或目录名：

```
# 这是注释行
images
system_prompt
.gitignore
requirement_new.md
user_prompt.txt
.git
my-important-file.txt
docs/
```

## 命令行选项

| 选项 | 说明 |
|------|------|
| `-h, --help` | 显示帮助信息 |
| `-c, --config FILE` | 指定配置文件路径 |
| `-k, --keep ITEM` | 添加要保留的文件或目录 |
| `-l, --list` | 列出当前保留列表 |
| `-y, --yes` | 跳过确认直接执行 |
| `--dry-run` | 预览模式，只显示将要删除的文件 |

## 使用示例

### 示例 1：首次使用，预览将要删除的文件
```bash
./cleanup.sh --dry-run
```

### 示例 2：保留 package.json 和 docs 目录
```bash
./cleanup.sh -k package.json -k docs --dry-run
```

### 示例 3：使用自定义配置文件
```bash
# 创建自定义配置
echo "images" > my.config
echo "docs" >> my.config
echo "package.json" >> my.config

# 使用自定义配置
./cleanup.sh -c my.config --dry-run
```

### 示例 4：快速清理（跳过确认）
```bash
./cleanup.sh -y
```

## 安全提示

1. **首次使用请先运行预览模式**：`./cleanup.sh --dry-run`
2. **重要文件请添加到配置文件中**
3. **删除的文件无法恢复**，请确保已备份重要数据
4. **脚本会自动保留 `.git` 目录**，不会影响版本控制

## 故障排除

### 问题：脚本没有执行权限
```bash
chmod +x cleanup.sh
```

### 问题：配置文件路径错误
确保配置文件路径正确，或使用绝对路径：
```bash
./cleanup.sh -c /path/to/your/config
```

### 问题：意外删除了重要文件
1. 检查 Git 历史记录
2. 从备份恢复
3. 重新生成项目文件

## 技术细节

- **服务检测**：通过 `pgrep` 查找 Node.js 相关进程
- **文件匹配**：使用精确字符串匹配，不支持通配符
- **删除方式**：使用 `rm -rf` 递归删除
- **兼容性**：支持 macOS 和 Linux

## 更新配置

如果你需要经常保留某些文件，建议修改 `cleanup.config` 文件：

```bash
# 编辑配置文件
nano cleanup.config

# 查看当前配置
./cleanup.sh --list
```

这样就不需要每次都用 `-k` 参数指定了。