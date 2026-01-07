// 混沌留言板功能
const API_BASE = 'https://chaos-message-board.yukiyu.workers.dev';

mixins.chaosboard = {
    data() {
        return {
            form: {
                username: localStorage.getItem('chaosboard_username') || '',
                email: localStorage.getItem('chaosboard_email') || '',
                content: ''
            },
            messages: [],
            pagination: {
                page: 1,
                pageSize: 10,
                total: 0,
                totalPages: 0
            },
            loadingMessages: true,
            submitting: false,
            submitStatus: null
        };
    },
    mounted() {
        this.loadMessages(1);
    },
    methods: {
        async loadMessages(page = 1) {
            if (page < 1) return;
            
            this.loadingMessages = true;
            try {
                const response = await fetch(
                    `${API_BASE}/api/messages?page=${page}&pageSize=${this.pagination.pageSize}`
                );
                const result = await response.json();
                
                if (result.success) {
                    // 转换时间为本地时区
                    this.messages = result.data.messages.map(msg => ({
                        ...msg,
                        created_at: this.formatLocalTime(msg.created_at)
                    }));
                    this.pagination = result.data.pagination;
                } else {
                    console.error('加载留言失败:', result.error);
                }
            } catch (error) {
                console.error('请求失败:', error);
            } finally {
                this.loadingMessages = false;
            }
        },
        
        // 将 UTC 时间转换为本地时间
        formatLocalTime(utcTimeStr) {
            // API 返回格式: "2026-01-06 07:13:29" (UTC)
            const utcDate = new Date(utcTimeStr + ' UTC');
            
            // 格式化为本地时间
            const year = utcDate.getFullYear();
            const month = String(utcDate.getMonth() + 1).padStart(2, '0');
            const day = String(utcDate.getDate()).padStart(2, '0');
            const hours = String(utcDate.getHours()).padStart(2, '0');
            const minutes = String(utcDate.getMinutes()).padStart(2, '0');
            
            return `${year}-${month}-${day} ${hours}:${minutes}`;
        },
        
        async submitMessage() {
            // 验证表单
            if (!this.form.username.trim()) {
                this.showStatus('error', '请输入用户名');
                return;
            }
            if (!this.form.email.trim()) {
                this.showStatus('error', '请输入邮箱');
                return;
            }
            if (!this.form.content.trim()) {
                this.showStatus('error', '请输入留言内容');
                return;
            }
            
            // 简单邮箱格式验证
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.form.email)) {
                this.showStatus('error', '请输入有效的邮箱地址');
                return;
            }
            
            this.submitting = true;
            this.submitStatus = null;
            
            try {
                const response = await fetch(`${API_BASE}/api/messages`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        username: this.form.username.trim(),
                        email: this.form.email.trim(),
                        content: this.form.content.trim()
                    })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // 保存用户名和邮箱到本地存储
                    localStorage.setItem('chaosboard_username', this.form.username);
                    localStorage.setItem('chaosboard_email', this.form.email);
                    
                    // 清空内容
                    this.form.content = '';
                    
                    // 显示成功消息
                    this.showStatus('success', '留言发布成功！');
                    
                    // 刷新留言列表（回到第一页）
                    this.loadMessages(1);
                } else {
                    this.showStatus('error', result.error || '发布失败，请稍后重试');
                }
            } catch (error) {
                console.error('提交失败:', error);
                this.showStatus('error', '网络错误，请稍后重试');
            } finally {
                this.submitting = false;
            }
        },
        
        showStatus(type, message) {
            this.submitStatus = { type, message };
            // 3秒后自动清除状态
            setTimeout(() => {
                this.submitStatus = null;
            }, 3000);
        }
    }
};
