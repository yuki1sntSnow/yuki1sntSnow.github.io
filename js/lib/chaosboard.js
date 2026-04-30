// ChaosBoard guestbook front-end logic.
const API_BASE = 'https://chaos-message-board.yukiyu.workers.dev';

mixins.chaosboard = {
    data() {
        return {
            form: {
                username: localStorage.getItem('chaosboard_username') || '',
                email:    localStorage.getItem('chaosboard_email')    || '',
                content:  ''
            },
            messages: [],
            pagination: {
                page: 1,
                pageSize: 10,
                total: 0,
                totalPages: 0
            },
            loadingMessages: true,
            loadError: null,
            submitting: false,
            submitStatus: null
        };
    },
    /*
     * Fetch in `created` rather than `mounted`. Created fires before the
     * DOM is built, so the request goes out as early as possible — by the
     * time Vue paints, the response is often already on its way back.
     * Avoids the "first visit shows empty until force-refresh" symptom.
     */
    created() {
        this.loadMessages(1);
    },
    methods: {
        async loadMessages(page = 1) {
            if (page < 1) return;

            this.loadingMessages = true;
            this.loadError = null;
            try {
                const response = await fetch(
                    `${API_BASE}/api/messages?page=${page}&pageSize=${this.pagination.pageSize}`,
                    { cache: 'no-store' }
                );
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }
                const result = await response.json();

                if (result.success) {
                    this.messages = result.data.messages.map(msg => ({
                        ...msg,
                        created_at: this.formatLocalTime(msg.created_at)
                    }));
                    this.pagination = result.data.pagination;
                } else {
                    this.loadError = result.error || 'Unknown server error';
                }
            } catch (error) {
                console.error('chaosboard fetch failed:', error);
                this.loadError = error.message || 'Network error';
            } finally {
                this.loadingMessages = false;
            }
        },

        retryLoad() {
            this.loadMessages(this.pagination.page || 1);
        },

        // Convert UTC timestamp from API to user's local time string.
        formatLocalTime(utcTimeStr) {
            const utcDate = new Date(utcTimeStr + ' UTC');
            const y  = utcDate.getFullYear();
            const m  = String(utcDate.getMonth() + 1).padStart(2, '0');
            const d  = String(utcDate.getDate()).padStart(2, '0');
            const hh = String(utcDate.getHours()).padStart(2, '0');
            const mm = String(utcDate.getMinutes()).padStart(2, '0');
            return `${y}-${m}-${d} ${hh}:${mm}`;
        },

        async submitMessage() {
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
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        username: this.form.username.trim(),
                        email:    this.form.email.trim(),
                        content:  this.form.content.trim()
                    })
                });
                const result = await response.json();

                if (result.success) {
                    localStorage.setItem('chaosboard_username', this.form.username);
                    localStorage.setItem('chaosboard_email',    this.form.email);
                    this.form.content = '';
                    this.showStatus('success', '留言发布成功！');
                    this.loadMessages(1);
                } else {
                    this.showStatus('error', result.error || '发布失败，请稍后重试');
                }
            } catch (error) {
                console.error('chaosboard submit failed:', error);
                this.showStatus('error', '网络错误，请稍后重试');
            } finally {
                this.submitting = false;
            }
        },

        showStatus(type, message) {
            this.submitStatus = { type, message };
            setTimeout(() => { this.submitStatus = null; }, 3000);
        }
    }
};
