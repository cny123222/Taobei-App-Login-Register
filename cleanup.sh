#!/bin/bash

# 项目清理脚本
# 功能：停止前后端服务并清理项目文件，保留指定的文件和目录

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/Users/cq123222/Desktop/25-26 Fall/软件工程与项目管理/lab/taobei-app-new"

# 默认保留的文件和目录列表（可自定义）
DEFAULT_KEEP_ITEMS=(
    "images"
    "system_prompt"
    ".gitignore"
    "requirement_new.md"
    "user_prompt.txt"
    ".git"
    "cleanup.sh"  # 保留脚本自身
)

# 从配置文件读取保留列表（如果存在）
CONFIG_FILE="$PROJECT_ROOT/cleanup.config"

# 打印带颜色的消息
print_message() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# 显示帮助信息
show_help() {
    echo "项目清理脚本使用说明："
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示此帮助信息"
    echo "  -c, --config FILE   指定配置文件路径"
    echo "  -k, --keep ITEM     添加要保留的文件或目录"
    echo "  -l, --list          列出当前保留列表"
    echo "  -y, --yes           跳过确认直接执行"
    echo "  --dry-run           预览模式，只显示将要删除的文件"
    echo ""
    echo "配置文件格式："
    echo "  每行一个要保留的文件或目录名"
    echo "  以 # 开头的行为注释"
    echo ""
    echo "示例："
    echo "  $0                  # 使用默认配置清理"
    echo "  $0 -k myfile.txt    # 额外保留 myfile.txt"
    echo "  $0 --dry-run        # 预览将要删除的文件"
    echo "  $0 -c my.config     # 使用自定义配置文件"
}

# 读取配置文件
read_config() {
    local config_file=$1
    
    if [[ -f "$config_file" ]]; then
        print_message $BLUE "从配置文件读取保留列表: $config_file"
        while IFS= read -r line; do
            # 跳过空行和注释行
            if [[ -n "$line" && ! "$line" =~ ^[[:space:]]*# ]]; then
                echo "$line"
            fi
        done < "$config_file"
    else
        print_message $YELLOW "配置文件不存在，使用默认配置"
        printf '%s\n' "${DEFAULT_KEEP_ITEMS[@]}"
    fi
}

# 停止前后端服务
stop_services() {
    print_message $YELLOW "正在停止前后端服务..."
    
    # 查找并停止 Node.js 进程（前端和后端）
    local node_pids=$(pgrep -f "node.*server\|npm.*start\|npm.*dev\|yarn.*start\|yarn.*dev")
    if [[ -n "$node_pids" ]]; then
        print_message $BLUE "发现运行中的 Node.js 服务，PID: $node_pids"
        echo "$node_pids" | xargs kill -TERM 2>/dev/null
        sleep 2
        
        # 如果还有进程在运行，强制杀死
        local remaining_pids=$(pgrep -f "node.*server\|npm.*start\|npm.*dev\|yarn.*start\|yarn.*dev")
        if [[ -n "$remaining_pids" ]]; then
            print_message $RED "强制停止剩余进程: $remaining_pids"
            echo "$remaining_pids" | xargs kill -KILL 2>/dev/null
        fi
        
        print_message $GREEN "前后端服务已停止"
    else
        print_message $GREEN "没有发现运行中的前后端服务"
    fi
}

# 检查文件是否在保留列表中
is_file_to_keep() {
    local file=$1
    shift
    local keep_items=("$@")
    
    for keep_item in "${keep_items[@]}"; do
        if [[ "$file" == "$keep_item" ]]; then
            return 0  # 文件在保留列表中
        fi
    done
    return 1  # 文件不在保留列表中
}

# 列出将要删除的文件
list_files_to_delete() {
    local keep_items=("$@")
    local files_to_delete=()
    
    cd "$PROJECT_ROOT" || exit 1
    
    # 查找所有文件和目录
    while IFS= read -r -d '' file; do
        local basename_file=$(basename "$file")
        if ! is_file_to_keep "$basename_file" "${keep_items[@]}"; then
            files_to_delete+=("$file")
        fi
    done < <(find . -maxdepth 1 -not -path . -print0)
    
    echo "${files_to_delete[@]}"
}

# 清理文件
cleanup_files() {
    local keep_items=("$@")
    local dry_run=${DRY_RUN:-false}
    
    print_message $YELLOW "开始清理项目文件..."
    
    cd "$PROJECT_ROOT" || exit 1
    
    local files_to_delete=($(list_files_to_delete "${keep_items[@]}"))
    
    if [[ ${#files_to_delete[@]} -eq 0 ]]; then
        print_message $GREEN "没有需要删除的文件"
        return
    fi
    
    print_message $BLUE "将要删除的文件和目录:"
    for file in "${files_to_delete[@]}"; do
        echo "  - $file"
    done
    
    if [[ "$dry_run" == "true" ]]; then
        print_message $YELLOW "预览模式：以上文件将被删除（实际未删除）"
        return
    fi
    
    # 执行删除
    for file in "${files_to_delete[@]}"; do
        if [[ -e "$file" ]]; then
            rm -rf "$file"
            print_message $GREEN "已删除: $file"
        fi
    done
    
    print_message $GREEN "文件清理完成！"
}

# 显示保留列表
show_keep_list() {
    local keep_items=("$@")
    print_message $BLUE "当前保留列表:"
    for item in "${keep_items[@]}"; do
        echo "  - $item"
    done
}

# 确认操作
confirm_operation() {
    local keep_items=("$@")
    
    echo ""
    print_message $YELLOW "=== 操作确认 ==="
    show_keep_list "${keep_items[@]}"
    echo ""
    
    local files_to_delete=($(list_files_to_delete "${keep_items[@]}"))
    if [[ ${#files_to_delete[@]} -gt 0 ]]; then
        print_message $RED "将要删除的文件和目录:"
        for file in "${files_to_delete[@]}"; do
            echo "  - $file"
        done
    else
        print_message $GREEN "没有需要删除的文件"
        return 0
    fi
    
    echo ""
    print_message $RED "警告：此操作将永久删除上述文件，无法恢复！"
    read -p "确定要继续吗？(y/N): " -n 1 -r
    echo
    
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        return 0
    else
        print_message $YELLOW "操作已取消"
        return 1
    fi
}

# 主函数
main() {
    local config_file="$CONFIG_FILE"
    local additional_keep=()
    local show_list=false
    local skip_confirm=false
    local dry_run=false
    
    # 解析命令行参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--config)
                config_file="$2"
                shift 2
                ;;
            -k|--keep)
                additional_keep+=("$2")
                shift 2
                ;;
            -l|--list)
                show_list=true
                shift
                ;;
            -y|--yes)
                skip_confirm=true
                shift
                ;;
            --dry-run)
                dry_run=true
                shift
                ;;
            *)
                print_message $RED "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查项目目录
    if [[ ! -d "$PROJECT_ROOT" ]]; then
        print_message $RED "错误：项目目录不存在: $PROJECT_ROOT"
        exit 1
    fi
    
    # 读取保留列表
    local keep_items=()
    while IFS= read -r line; do
        if [[ -n "$line" ]]; then
            keep_items+=("$line")
        fi
    done < <(read_config "$config_file")
    keep_items+=("${additional_keep[@]}")
    
    # 如果只是显示列表
    if [[ "$show_list" == "true" ]]; then
        show_keep_list "${keep_items[@]}"
        exit 0
    fi
    
    # 设置全局变量
    export DRY_RUN="$dry_run"
    
    print_message $BLUE "=== 项目清理脚本 ==="
    print_message $BLUE "项目目录: $PROJECT_ROOT"
    
    # 确认操作（除非跳过确认或预览模式）
    if [[ "$skip_confirm" == "false" && "$dry_run" == "false" ]]; then
        if ! confirm_operation "${keep_items[@]}"; then
            exit 0
        fi
    fi
    
    # 停止服务
    stop_services
    
    # 清理文件
    cleanup_files "${keep_items[@]}"
    
    if [[ "$dry_run" == "false" ]]; then
        print_message $GREEN "=== 清理完成 ==="
    fi
}

# 运行主函数
main "$@"