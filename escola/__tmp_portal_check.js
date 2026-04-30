
        const API_BASE = 'http://chamadafacil-api.local';
        const STORAGE_KEY = 'cf_portal_school_auth';

        const state = {
            token: '',
            user: null,
            memberships: [],
            sessions: [],
            dashboard: null,
            dashboardRecentSessions: [],
            dashboardRecentSummary: null,
            organizationMembers: [],
            organizationMembersSummary: null,
            organizationAssignments: [],
            organizationAssignmentsSummary: null,
            classCreateBusy: false,
            assignmentBusyClassId: null,
            classStudents: [],
            classStudentsSummary: null,
            selectedStudentClassId: null,
            studentCreateBusy: false,
            studentImportBusy: false
        };

        function showMessage(text, tone) {
            const el = document.getElementById('school-message');
            const colors = {
                info: 'var(--blue)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = '700';
        }

        function setAuthMessage(text, tone = 'info') {
            const el = document.getElementById('school-auth-message');
            const colors = {
                info: 'var(--muted)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = text ? '700' : '500';
        }

        function setClassCreateMessage(text, tone = 'info') {
            const el = document.getElementById('org-class-create-message');
            const colors = {
                info: 'var(--muted)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = text ? '700' : '500';
        }

        function setStudentCreateMessage(text, tone = 'info') {
            const el = document.getElementById('org-student-create-message');
            if (!el) return;
            const colors = {
                info: 'var(--muted)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = text ? '700' : '500';
        }

        function setStudentImportMessage(text, tone = 'info') {
            const el = document.getElementById('org-student-import-message');
            if (!el) return;
            const colors = {
                info: 'var(--muted)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = text ? '700' : '500';
        }

        function setStudentQrMessage(text, tone = 'info') {
            const el = document.getElementById('org-student-qr-message');
            if (!el) return;
            const colors = {
                info: 'var(--muted)',
                success: 'var(--teal)',
                warn: '#92400e',
                error: '#b91c1c'
            };
            el.textContent = text;
            el.style.color = colors[tone] || 'var(--muted)';
            el.style.fontWeight = text ? '700' : '500';
        }

        async function apiRequest(path, options = {}) {
            const response = await fetch(`${API_BASE}${path}`, {
                method: options.method || 'GET',
                headers: {
                    Accept: 'application/json',
                    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
                    ...(state.token ? { Authorization: `Bearer ${state.token}` } : {})
                },
                body: options.body ? JSON.stringify(options.body) : undefined
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(data?.message || data?.error || `HTTP ${response.status}`);
            }
            return data;
        }

        function persistAuth(payload) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
        }

        function restoreAuth() {
            try {
                const raw = localStorage.getItem(STORAGE_KEY);
                if (!raw) return false;
                const saved = JSON.parse(raw);
                state.token = saved?.token || '';
                state.user = saved?.user || null;
                state.memberships = saved?.memberships || (saved?.membership ? [saved.membership] : []);
                return !!state.token;
            } catch {
                return false;
            }
        }

        function renderSessionCard() {
            const userLabel = state.user?.name || state.user?.email || 'Sem sessão ativa';
            const orgLabel = state.memberships[0]?.organization?.name || 'Sem organização ativa';
            document.getElementById('session-user').value = userLabel;
            document.getElementById('session-organization').value = orgLabel;
        }

        function clearAuth() {
            state.token = '';
            state.user = null;
            state.memberships = [];
            state.sessions = [];
            state.dashboard = null;
            state.dashboardRecentSessions = [];
            state.dashboardRecentSummary = null;
            state.organizationMembers = [];
            state.organizationMembersSummary = null;
            state.organizationAssignments = [];
            state.organizationAssignmentsSummary = null;
            state.classStudents = [];
            state.classStudentsSummary = null;
            state.selectedStudentClassId = null;
            localStorage.removeItem(STORAGE_KEY);
            renderSessionCard();
            setAuthMessage('Sessão institucional removida deste navegador.', 'info');
            showMessage('Volte para a tela de acesso para entrar novamente com uma conta institucional.', 'info');
            renderOrganizationSessions([], null);
            renderOrganizationMembers([], null);
            renderOrganizationAssignments([], null);
            renderOrganizationStudents([], null, null);
        }

        function formatDate(value) {
            if (!value) return 'Sem data';
            const date = new Date(`${value}T00:00:00`);
            return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('pt-BR');
        }

        function escapeHtml(value) {
            return String(value || '')
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&#39;');
        }

        function roleLabel(role) {
            const labels = {
                owner: 'Direção',
                manager: 'Coordenação',
                teacher: 'Professor',
                viewer: 'Leitura'
            };
            return labels[role] || 'Equipe';
        }

        function splitDelimitedLine(line, delimiter) {
            const cells = [];
            let current = '';
            let inQuotes = false;
            for (let i = 0; i < line.length; i += 1) {
                const char = line[i];
                if (char === '"') {
                    if (inQuotes && line[i + 1] === '"') {
                        current += '"';
                        i += 1;
                    } else {
                        inQuotes = !inQuotes;
                    }
                    continue;
                }
                if (char === delimiter && !inQuotes) {
                    cells.push(current.trim());
                    current = '';
                    continue;
                }
                current += char;
            }
            cells.push(current.trim());
            return cells;
        }

        function detectDelimiter(headerLine) {
            const semicolons = (headerLine.match(/;/g) || []).length;
            const commas = (headerLine.match(/,/g) || []).length;
            return semicolons >= commas ? ';' : ',';
        }

        function normalizeStudentHeader(value) {
            return String(value || '')
                .normalize('NFD')
                .replace(/[̀-ͯ]/g, '')
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, '_')
                .replace(/^_+|_+$/g, '');
        }

        function parseDelimitedRows(raw) {
            const lines = String(raw || '').replace(/\r/g, '').split('\n').map((line) => line.trim()).filter(Boolean);
            if (lines.length < 2) {
                throw new Error('O CSV precisa ter cabeçalho e pelo menos uma linha de aluno.');
            }
            const delimiter = detectDelimiter(lines[0]);
            const headers = splitDelimitedLine(lines[0], delimiter).map(normalizeStudentHeader);
            const nameIndex = headers.findIndex((header) => ['nome', 'full_name', 'aluno', 'student_name'].includes(header));
            const enrollmentIndex = headers.findIndex((header) => ['matricula', 'enrollment', 'enrollment_code', 'codigo_matricula'].includes(header));
            const externalIndex = headers.findIndex((header) => ['id_externo', 'external_id', 'codigo_externo', 'id'].includes(header));

            if (nameIndex < 0) {
                throw new Error('O CSV precisa de uma coluna de nome do aluno.');
            }

            return lines.slice(1).map((line) => {
                const cells = splitDelimitedLine(line, delimiter);
                return {
                    full_name: cells[nameIndex] || '',
                    enrollment_code: enrollmentIndex >= 0 ? (cells[enrollmentIndex] || '') : '',
                    external_id: externalIndex >= 0 ? (cells[externalIndex] || '') : ''
                };
            }).filter((row) => row.full_name.trim() !== '');
        }

        function getAssignableMembers() {
            return (state.organizationMembers || []).filter((member) =>
                member && member.status === 'active' && ['owner', 'manager', 'teacher'].includes(member.role)
            );
        }

        async function assignTeacherToClass(payload) {
            return apiRequest('/organizations/class-assignments', {
                method: 'POST',
                body: payload
            });
        }

        async function createOrganizationStudent(payload) {
            return apiRequest('/organizations/students', {
                method: 'POST',
                body: payload
            });
        }

        async function importOrganizationStudents(payload) {
            return apiRequest('/organizations/students/import', {
                method: 'POST',
                body: payload
            });
        }

        async function generateOrganizationStudentQRCodes(payload) {
            return apiRequest('/organizations/students/qrcodes', {
                method: 'POST',
                body: payload
            });
        }

        function buildStudentQrPayload(student) {
            if (student && student.qr_payload) {
                return student.qr_payload;
            }
            const identifier = String(student?.qr_token || '');
            const enrollment = String(student?.enrollment_code || student?.external_id || '');
            const name = String(student?.full_name || '').trim().slice(0, 60);
            return `CF1|${JSON.stringify([identifier, enrollment, name])}`;
        }

        async function generateOrganizationQrPdf(bundle) {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            const organizationName = bundle?.organization?.name || 'Chamada Fácil Escola';
            const className = bundle?.class?.name || 'Turma';
            const students = Array.isArray(bundle?.students) ? [...bundle.students] : [];
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const cols = 4;
            const rows = 6;
            const marginX = 12;
            const firstRowY = 34;
            const bottomMargin = 12;
            const spacingX = 4;
            const spacingY = 3;
            const contentWidth = pageWidth - (2 * marginX);
            const contentHeight = pageHeight - firstRowY - bottomMargin;
            const cellWidth = (contentWidth - (spacingX * (cols - 1))) / cols;
            const cellHeight = (contentHeight - (spacingY * (rows - 1))) / rows;
            const qrSize = Math.max(22, Math.min(cellWidth - 8, cellHeight - 12));
            let currentPage = 1;
            let currentRow = 0;
            let currentCol = 0;

            students.sort((a, b) => String(a.full_name || '').localeCompare(String(b.full_name || ''), 'pt-BR'));

            const addPageTitle = () => {
                doc.setTextColor(22, 29, 44);
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text('Chamada Fácil Escola', 10, 15);
                doc.setFontSize(13);
                doc.setFont(undefined, 'bold');
                doc.text(className, pageWidth - 10, 15, { align: 'right' });
                doc.setFontSize(9);
                doc.setFont(undefined, 'normal');
                doc.setTextColor(90, 102, 121);
                doc.text(organizationName, 10, 22);
                if (currentPage === 1) {
                    doc.text('Kit centralizado de QR Codes (layout 4x6)', pageWidth - 10, 22, { align: 'right' });
                }
            };

            addPageTitle();

            for (let i = 0; i < students.length; i++) {
                const student = students[i];
                if (i > 0 && currentRow >= rows) {
                    doc.addPage();
                    currentPage++;
                    currentRow = 0;
                    currentCol = 0;
                    addPageTitle();
                }
                const cellX = marginX + (currentCol * (cellWidth + spacingX));
                const cellY = firstRowY + (currentRow * (cellHeight + spacingY));
                const x = cellX + ((cellWidth - qrSize) / 2);
                const y = cellY + 1;
                const qrDataUrl = await QRCode.toDataURL(buildStudentQrPayload(student), {
                    errorCorrectionLevel: 'M',
                    margin: 1,
                    width: 256,
                    color: { dark: '#000000', light: '#ffffff' }
                });
                doc.addImage(qrDataUrl, 'PNG', x, y, qrSize, qrSize);
                doc.setTextColor(18, 24, 39);
                doc.setFontSize(7);
                doc.setFont(undefined, 'bold');
                const nameX = cellX + (cellWidth / 2);
                const splitName = doc.splitTextToSize(String(student.full_name || ''), cellWidth - 4).slice(0, 2);
                doc.text(splitName, nameX, y + qrSize + 4, { align: 'center' });
                const nameHeight = splitName.length * 3.2;
                doc.setFontSize(6.2);
                doc.setFont(undefined, 'normal');
                const enrollment = String(student.enrollment_code || student.external_id || 'Sem matrícula');
                doc.text(`Mat: ${enrollment}`, nameX, y + qrSize + 4 + nameHeight, { align: 'center' });
                doc.setDrawColor(220, 220, 220);
                doc.rect(cellX, cellY, cellWidth, cellHeight);
                currentCol++;
                if (currentCol >= cols) {
                    currentCol = 0;
                    currentRow++;
                }
            }

            const filename = `qrcodes_${className}.pdf`.replace(/[^a-z0-9.-]/gi, '_');
            doc.save(filename);
        }

        function getOrganizationFilters() {
            return {
                date_from: document.getElementById('org-filter-date-from').value.trim(),
                date_to: document.getElementById('org-filter-date-to').value.trim(),
                teacher_name: document.getElementById('org-filter-teacher').value.trim(),
                class_name: document.getElementById('org-filter-class').value.trim()
            };
        }

        function hasOrganizationFilters(filters) {
            return Boolean(filters.date_from || filters.date_to || filters.teacher_name || filters.class_name);
        }

        function buildQuery(params) {
            const query = new URLSearchParams();
            Object.entries(params || {}).forEach(([key, value]) => {
                if (value !== undefined && value !== null && String(value).trim() !== '') {
                    query.set(key, String(value).trim());
                }
            });
            return query.toString();
        }

        async function createOrganizationClass(payload) {
            const organizationId = state.memberships[0]?.organization?.id;
            if (!organizationId) {
                throw new Error('Nenhuma organização ativa para cadastrar turma.');
            }

            return apiRequest('/organizations/classes', {
                method: 'POST',
                body: {
                    organization_id: organizationId,
                    ...payload
                }
            });
        }

        async function loadOrganizationSessions(filters = {}) {
            const organizationId = state.memberships[0]?.organization?.id;
            if (!organizationId) {
                renderOrganizationSessions([], null);
                return;
            }

            if (!hasOrganizationFilters(filters)) {
                renderOrganizationSessions(state.dashboardRecentSessions || [], state.dashboardRecentSummary || null);
                showMessage('Exibindo a leitura institucional padrão da organização.', 'success');
                return;
            }

            const query = buildQuery({ organization_id: organizationId, limit: 10, ...filters });
            const data = await apiRequest(`/organizations/attendance-sessions?${query}`);
            renderOrganizationSessions(data.sessions || [], data.summary || null);
            showMessage(`Filtros aplicados. ${data.pagination?.total || 0} chamada(s) encontrada(s) para a organização.`, 'success');
        }

        function renderOrganizationSessions(sessions, summary) {
            state.sessions = sessions || [];

            const list = document.getElementById('org-sessions-list');
            const orgName = state.memberships[0]?.organization?.name || 'organização ativa';
            const formatPercent = (value) => `${String(Number(value || 0)).replace('.', ',')}%`;

            if (!sessions || !sessions.length) {
                list.innerHTML = `
                    <div style="padding:16px; border-radius:18px; background:rgba(37,99,235,0.06); border:1px dashed rgba(37,99,235,0.18); color:var(--muted); font-size:14px; line-height:1.55;">
                        Ainda não há chamadas sincronizadas para ${escapeHtml(orgName)}. Assim que o professor finalizar uma chamada no app, ela aparece aqui com turma, horário e frequência.
                    </div>
                `;
                return;
            }

            const latest = sessions[0];
            const cards = sessions.slice(0, 5).map((session) => {
                const presentCount = Number(session.present_count || 0);
                const totalStudents = Number(session.total_students || 0);
                const absentCount = Math.max(totalStudents - presentCount, 0);
                const frequencyPercent = Number(session.frequency_percent || 0);
                const scoreColor = frequencyPercent >= 80 ? '#166534' : frequencyPercent >= 60 ? '#92400e' : '#b91c1c';
                const scoreBg = frequencyPercent >= 80 ? 'rgba(22,163,74,0.12)' : frequencyPercent >= 60 ? 'rgba(245,158,11,0.14)' : 'rgba(239,68,68,0.12)';

                return `
                    <article style="display:grid; gap:12px; padding:16px; border-radius:22px; background:linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.92)); border:1px solid rgba(17,24,39,0.08); box-shadow:0 8px 24px rgba(15, 23, 42, 0.04);">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start;">
                            <div>
                                <div style="font-size:18px; font-weight:900; letter-spacing:-0.03em; color:var(--text);">${escapeHtml(session.class_name)}</div>
                                <div class="item-meta" style="margin-top:6px; gap:10px;">
                                    <span>${escapeHtml(session.school_name || 'Sem escola')}</span>
                                    <span>${formatDate(session.attendance_date)} · ${escapeHtml(session.slot || '—')}º horário</span>
                                    <span>${escapeHtml(session.teacher?.name || 'Professor')}</span>
                                </div>
                            </div>
                            <div style="display:inline-flex; align-items:center; justify-content:center; min-width:74px; min-height:40px; padding:0 14px; border-radius:16px; font-size:18px; font-weight:900; letter-spacing:-0.03em; background:${scoreBg}; color:${scoreColor};">${formatPercent(frequencyPercent)}</div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; color:var(--muted); font-size:12px; font-weight:700;">
                            <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.88); border:1px solid rgba(17,24,39,0.06);">${presentCount}/${totalStudents} presentes</span>
                            <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.88); border:1px solid rgba(17,24,39,0.06);">${absentCount} ausentes</span>
                            <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.88); border:1px solid rgba(17,24,39,0.06);">${escapeHtml(session.external_id || `#${session.id}`)}</span>
                        </div>
                    </article>
                `;
            }).join('');

            list.innerHTML = `
                <div style="display:grid; gap:12px;">
                    <div style="display:grid; gap:8px; padding:16px; border-radius:22px; background:linear-gradient(135deg, rgba(17,24,39,0.94), rgba(37,99,235,0.92)); color:white; box-shadow:0 18px 30px rgba(15, 23, 42, 0.10);">
                        <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; flex-wrap:wrap;">
                            <div>
                                <div style="font-size:11px; font-weight:800; letter-spacing:0.08em; text-transform:uppercase; color:#dbeafe;">Visão ao vivo</div>
                                <div style="font-size:18px; font-weight:900; letter-spacing:-0.03em; margin-top:6px;">Última leitura: ${escapeHtml(latest?.class_name || 'chamada da organização')}</div>
                            </div>
                            <div style="display:flex; flex-wrap:wrap; gap:8px;">
                                <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.12); font-size:12px; font-weight:800;">${escapeHtml(latest?.school_name || 'Escola')}</span>
                                <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.12); font-size:12px; font-weight:800;">${formatDate(latest.attendance_date)} · ${escapeHtml(latest.slot || '—')}º horário</span>
                                <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.12); font-size:12px; font-weight:800;">${escapeHtml(latest.teacher?.name || 'Professor')}</span>
                            </div>
                        </div>
                        <div style="display:flex; gap:10px; flex-wrap:wrap; font-size:12px; font-weight:700; color:rgba(255,255,255,0.82);">
                            <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.10);">${sessions.length} chamada(s) recente(s)</span>
                            <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; background:rgba(255,255,255,0.10);">Atualizado agora</span>
                        </div>
                    </div>
                    ${cards}
                </div>
            `;
        }


        function formatRoleLabel(role) {
            const labels = {
                owner: 'Direção',
                manager: 'Coordenação',
                teacher: 'Professor',
                viewer: 'Consulta'
            };
            return labels[role] || 'Equipe';
        }

        function formatStatusLabel(status) {
            return status === 'active' ? 'Ativo' : 'Inativo';
        }

        function renderOrganizationMembers(members, summary) {
            state.organizationMembers = members || [];
            state.organizationMembersSummary = summary || null;

            const list = document.getElementById('org-members-list');
            const chip = document.getElementById('org-members-chip');
            const orgName = state.memberships[0]?.organization?.name || 'organização ativa';

            if (!members || !members.length) {
                chip.textContent = 'Sem equipe';
                chip.className = 'chip warn';
                list.innerHTML = `<div style="padding:14px; border-radius:18px; background:rgba(245,158,11,0.08); border:1px dashed rgba(245,158,11,0.16); color:#92400e; font-size:14px; line-height:1.5;">Ainda não há vínculos institucionais ativos para ${escapeHtml(orgName)}. Assim que a coordenação cadastrar professores e acessos, a equipe aparece aqui.</div>`;
                return;
            }

            const total = Number(summary?.total || members.length || 0);
            const managers = Number(summary?.owners || 0) + Number(summary?.managers || 0);
            const teachers = Number(summary?.teachers || 0);
            chip.textContent = `${total} perfil(is)`;
            chip.className = 'chip info';

            const cards = members.slice(0, 6).map((member) => {
                const roleLabel = formatRoleLabel(member.role);
                const statusLabel = formatStatusLabel(member.status);
                const statusTone = member.status === 'active' ? 'rgba(22,163,74,0.12); color:#166534;' : 'rgba(239,68,68,0.12); color:#b91c1c;';
                return `
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:14px; border-radius:18px; background:linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.92)); border:1px solid rgba(17,24,39,0.08); margin-top:8px;">
                        <div style="display:grid; gap:5px;">
                            <strong style="font-size:15px; color:var(--text);">${escapeHtml(member.user?.name || member.user?.email || 'Usuário')}</strong>
                            <span class="small-note" style="color:var(--muted);">${escapeHtml(member.user?.email || 'Sem e-mail')}</span>
                            <div style="display:flex; gap:8px; flex-wrap:wrap; margin-top:2px;">
                                <span class="chip info">${escapeHtml(roleLabel)}</span>
                                <span style="display:inline-flex; align-items:center; min-height:28px; padding:0 10px; border-radius:999px; font-size:12px; font-weight:800; ${statusTone}">${escapeHtml(statusLabel)}</span>
                            </div>
                        </div>
                        <div class="small-note" style="text-align:right; min-width:110px;">Vínculo desde<br><strong style="color:var(--text);">${escapeHtml(formatDate((member.created_at || '').slice(0, 10)))}</strong></div>
                    </div>
                `;
            }).join('');

            list.innerHTML = `
                <div style="display:grid; gap:10px;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:2px;">
                        <span class="chip info">${managers} gestão</span>
                        <span class="chip info">${teachers} professor(es)</span>
                        <span class="chip ok">${Number(summary?.active || total)} vínculo(s) ativo(s)</span>
                    </div>
                    ${cards}
                </div>
            `;
        }

        async function loadOrganizationMembers() {
            const organizationId = state.memberships[0]?.organization?.id;
            if (!organizationId) {
                renderOrganizationMembers([], null);
                return;
            }

            const data = await apiRequest(`/organizations/members?organization_id=${organizationId}`);
            renderOrganizationMembers(data.members || [], data.summary || null);
        }


        function renderOrganizationAssignments(classes, summary) {
            state.organizationAssignments = classes || [];
            state.organizationAssignmentsSummary = summary || null;

            const list = document.getElementById('org-assignments-list');
            const chip = document.getElementById('org-assignments-chip');
            const orgName = state.memberships[0]?.organization?.name || 'organização ativa';
            const assignableMembers = getAssignableMembers();

            if (!classes || !classes.length) {
                chip.textContent = 'Sem estrutura';
                chip.className = 'chip warn';
                list.innerHTML = `<div style="padding:14px; border-radius:18px; background:rgba(245,158,11,0.08); border:1px dashed rgba(245,158,11,0.16); color:#92400e; font-size:14px; line-height:1.5;">Ainda não há turmas estruturadas para ${escapeHtml(orgName)}. Assim que a secretaria centralizar a estrutura, este bloco passa a mostrar os responsáveis por turma.</div>`;
                return;
            }

            chip.textContent = `${Number(summary?.classes_total || classes.length)} turma(s)`;
            chip.className = 'chip info';

            const cards = classes.slice(0, 8).map((classItem) => {
                const teachers = classItem.teachers || [];
                const teacherBadges = teachers.length
                    ? teachers.map((teacher) => `<span class="chip info">${escapeHtml(teacher.user?.name || 'Professor')}</span>`).join(' ')
                    : '<span class="chip warn">Sem responsável</span>';
                const teacherMeta = teachers.length
                    ? teachers.map((teacher) => `${escapeHtml(teacher.user?.email || '')}${teacher.role ? ` · ${escapeHtml(roleLabel(teacher.role))}` : ''}`).filter(Boolean).join(' · ')
                    : 'A coordenação ainda precisa vincular um responsável a esta turma.';
                const assignControl = !teachers.length
                    ? (assignableMembers.length
                        ? `
                            <form class="org-assignment-form" data-class-id="${classItem.id}" style="display:grid; gap:8px; margin-top:8px;">
                                <div style="display:flex; gap:8px; flex-wrap:wrap; align-items:center;">
                                    <select data-assignment-select="${classItem.id}" style="flex:1; min-width:220px; min-height:42px; padding:0 12px; border-radius:14px; border:1px solid rgba(17,24,39,0.10); background:white; color:var(--text);">
                                        <option value="">Selecione o responsável</option>
                                        ${assignableMembers.map((member) => `<option value="${member.user.id}">${escapeHtml(member.user.name)} · ${escapeHtml(roleLabel(member.role))}</option>`).join('')}
                                    </select>
                                    <button class="btn btn-primary" type="submit" style="margin-top:0; width:auto; min-width:128px; min-height:42px; padding:0 14px;">Vincular</button>
                                </div>
                                <span class="small-note" data-assignment-message="${classItem.id}">Escolha quem ficará responsável por esta turma no app Escola.</span>
                            </form>
                        `
                        : '<span class="small-note" style="color:#92400e;">Cadastre ou vincule um membro da equipe antes de definir o responsável.</span>')
                    : `<span class="small-note" style="color:var(--teal);">Responsável operacional já definido. Você poderá trocar depois sem mexer no apk.</span>`;
                return `
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:14px; border-radius:18px; background:linear-gradient(135deg, rgba(255,255,255,0.98), rgba(241,245,249,0.92)); border:1px solid rgba(17,24,39,0.08); margin-top:8px;">
                        <div style="display:grid; gap:6px; flex:1;">
                            <strong style="font-size:15px; color:var(--text);">${escapeHtml(classItem.name || 'Turma')}</strong>
                            <div style="display:flex; gap:8px; flex-wrap:wrap;">${teacherBadges}</div>
                            <span class="small-note" style="color:var(--muted);">${teacherMeta}</span>
                            ${assignControl}
                        </div>
                        <div class="small-note" style="text-align:right; min-width:120px;">
                            <div><strong style="color:var(--text);">${teachers.length ? teachers.length : 0}</strong> responsável(is)</div>
                            <div style="margin-top:4px;">${escapeHtml(classItem.shift || 'Sem horário')}</div>
                        </div>
                    </div>
                `;
            }).join('');

            list.innerHTML = `
                <div style="display:grid; gap:10px;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:2px;">
                        <span class="chip info">${Number(summary?.classes_with_teacher || 0)} com responsável</span>
                        <span class="chip warn">${Number(summary?.classes_without_teacher || 0)} sem responsável</span>
                        <span class="chip ok">${Number(summary?.teachers_linked || 0)} professor(es) vinculado(s)</span>
                    </div>
                    ${cards}
                </div>
            `;

            list.querySelectorAll('.org-assignment-form').forEach((form) => {
                form.addEventListener('submit', async (event) => {
                    event.preventDefault();
                    const classId = Number(form.getAttribute('data-class-id') || 0);
                    if (!classId || state.assignmentBusyClassId === classId) {
                        return;
                    }

                    const select = form.querySelector(`[data-assignment-select="${classId}"]`);
                    const messageEl = form.querySelector(`[data-assignment-message="${classId}"]`);
                    const teacherUserId = Number(select?.value || 0);
                    const organizationId = state.memberships[0]?.organization?.id;
                    const className = classes.find((item) => Number(item.id) === classId)?.name || 'Turma';

                    if (!organizationId) {
                        if (messageEl) {
                            messageEl.textContent = 'Organização institucional indisponível neste navegador.';
                            messageEl.style.color = '#b91c1c';
                        }
                        return;
                    }

                    if (!teacherUserId) {
                        if (messageEl) {
                            messageEl.textContent = 'Selecione um responsável antes de vincular.';
                            messageEl.style.color = '#92400e';
                        }
                        return;
                    }

                    state.assignmentBusyClassId = classId;
                    const submitButton = form.querySelector('button[type="submit"]');
                    if (submitButton) {
                        submitButton.disabled = true;
                        submitButton.textContent = 'Salvando...';
                    }
                    if (messageEl) {
                        messageEl.textContent = 'Salvando vínculo institucional...';
                        messageEl.style.color = 'var(--muted)';
                    }

                    try {
                        const result = await assignTeacherToClass({
                            organization_id: organizationId,
                            organization_class_id: classId,
                            teacher_user_id: teacherUserId
                        });
                        if (messageEl) {
                            messageEl.textContent = `Responsável ${result.assignment?.user?.name || 'vinculado'} à turma ${className}.`;
                            messageEl.style.color = 'var(--teal)';
                        }
                        showMessage(`Turma ${className} agora está vinculada a ${result.assignment?.user?.name || 'um responsável'}.`, 'success');
                        await loadOrganizationAssignments();
                    } catch (error) {
                        if (messageEl) {
                            messageEl.textContent = error.message || 'Não foi possível salvar o vínculo.';
                            messageEl.style.color = '#b91c1c';
                        }
                    } finally {
                        state.assignmentBusyClassId = null;
                        if (submitButton) {
                            submitButton.disabled = false;
                            submitButton.textContent = 'Vincular';
                        }
                    }
                });
            });
        }

        function syncStudentClassSelect() {
            const classes = state.organizationAssignments || [];
            const current = state.selectedStudentClassId || Number(document.getElementById('org-student-class')?.value || 0) || Number(classes[0]?.id || 0) || 0;
            ['org-student-class', 'org-student-import-class'].forEach((id) => {
                const select = document.getElementById(id);
                if (!select) return;
                const previous = Number(select.value || current || 0);
                select.innerHTML = `<option value="">Selecione a turma</option>${classes.map((classItem) => `<option value="${classItem.id}">${escapeHtml(classItem.name)}${classItem.shift ? ` · ${escapeHtml(classItem.shift)}` : ''}</option>`).join('')}`;
                const target = previous || current;
                if (target) {
                    select.value = String(target);
                }
            });
            if (current) {
                state.selectedStudentClassId = current;
            }
        }

        function renderOrganizationStudents(students, summary, classInfo = null) {
            state.classStudents = students || [];
            state.classStudentsSummary = summary || null;
            const list = document.getElementById('org-students-list');
            const chip = document.getElementById('org-students-chip');
            const className = classInfo?.name || 'turma selecionada';

            if (!state.selectedStudentClassId) {
                chip.textContent = 'Escolha uma turma';
                chip.className = 'chip warn';
                list.innerHTML = '<div style="padding:14px; border-radius:18px; background:rgba(245,158,11,0.08); border:1px dashed rgba(245,158,11,0.16); color:#92400e; font-size:14px; line-height:1.5;">Escolha a turma acima para estruturar os alunos e preparar a geração centralizada de QR Code depois.</div>';
                return;
            }

            chip.textContent = `${Number(summary?.total || 0)} aluno(s)`;
            chip.className = 'chip info';

            if (!students || !students.length) {
                list.innerHTML = `<div style="padding:14px; border-radius:18px; background:rgba(37,99,235,0.08); border:1px dashed rgba(37,99,235,0.16); color:var(--blue); font-size:14px; line-height:1.5;">A turma ${escapeHtml(className)} ainda não possui alunos cadastrados no portal. Comece pelo formulário acima para tirar a base do celular e centralizar a secretaria.</div>`;
                return;
            }

            const rows = students.slice(0, 12).map((student) => {
                const qrChip = student.qr_status === 'generated'
                    ? '<span class="chip ok">QR gerado</span>'
                    : '<span class="chip warn">QR pendente</span>';
                const meta = [student.enrollment_code ? `Matrícula ${escapeHtml(student.enrollment_code)}` : null, student.external_id ? `ID ${escapeHtml(student.external_id)}` : null].filter(Boolean).join(' · ');
                return `
                    <div style="display:flex; justify-content:space-between; gap:12px; align-items:flex-start; padding:12px 14px; border-radius:16px; background:white; border:1px solid rgba(17,24,39,0.08); margin-top:8px;">
                        <div style="display:grid; gap:4px;">
                            <strong style="font-size:15px; color:var(--text);">${escapeHtml(student.full_name)}</strong>
                            <span class="small-note" style="color:var(--muted);">${meta || 'Sem matrícula/ID externo informado'}</span>
                        </div>
                        <div style="display:grid; gap:6px; justify-items:end;">${qrChip}<span class="small-note">${escapeHtml(formatDate(student.created_at?.slice?.(0, 10) || ''))}</span></div>
                    </div>
                `;
            }).join('');

            list.innerHTML = `
                <div style="display:grid; gap:10px;">
                    <div style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:2px;">
                        <span class="chip info">${Number(summary?.total || students.length)} na turma</span>
                        <span class="chip warn">${Number(summary?.qr_pending || 0)} QR pendente(s)</span>
                        <span class="chip ok">${Number(summary?.qr_generated || 0)} QR gerado(s)</span>
                    </div>
                    ${rows}
                </div>
            `;
        }

        async function loadOrganizationStudents(classId = null) {
            const organizationId = state.memberships[0]?.organization?.id;
            const targetClassId = Number(classId || state.selectedStudentClassId || 0);
            if (!organizationId || !targetClassId) {
                state.selectedStudentClassId = targetClassId || null;
                renderOrganizationStudents([], null, null);
                return;
            }

            state.selectedStudentClassId = targetClassId;
            const data = await apiRequest(`/organizations/students?organization_id=${organizationId}&organization_class_id=${targetClassId}`);
            renderOrganizationStudents(data.students || [], data.summary || null, data.class || null);
        }

        async function loadOrganizationAssignments() {
            const organizationId = state.memberships[0]?.organization?.id;
            if (!organizationId) {
                renderOrganizationAssignments([], null);
                syncStudentClassSelect();
                renderOrganizationStudents([], null, null);
                return;
            }

            const data = await apiRequest(`/organizations/class-assignments?organization_id=${organizationId}`);
            renderOrganizationAssignments(data.classes || [], data.summary || null);
            syncStudentClassSelect();
            await loadOrganizationStudents(state.selectedStudentClassId || Number(data.classes?.[0]?.id || 0));
        }

        function renderDashboard(summary, day, pendingClasses = []) {
            state.dashboard = summary || null;
            document.getElementById('org-metric-sessions').textContent = String(summary?.sessions_today || 0);
            document.getElementById('org-metric-teachers').textContent = String(summary?.teachers_active_today || 0);
            document.getElementById('org-metric-classes').textContent = String(summary?.classes_pending_today || 0);
            document.getElementById('org-metric-frequency').textContent = `${String(Number(summary?.frequency_percent_today || 0)).replace('.', ',')}%`;

            const note = document.getElementById('org-dashboard-note');
            const todayNote = document.getElementById('org-today-note');
            const pendingList = document.getElementById('org-pending-list');
            const pendingChip = document.getElementById('org-pending-chip');
            const dayLabel = formatDate(day || new Date().toISOString().slice(0, 10));
            if (!summary) {
                note.textContent = 'Assim que o backend consolidar as leituras do dia, este bloco passa a mostrar pendências reais da escola.';
                todayNote.textContent = 'Resumo do dia com turmas pendentes, professores ativos e frequência consolidada para a coordenação agir rápido.';
                pendingChip.textContent = 'Acompanhar';
                pendingChip.className = 'chip warn';
                pendingList.textContent = 'Assim que o dashboard institucional carregar, este bloco mostra as turmas que ainda não registraram chamada hoje.';
                return;
            }

            note.textContent = `${dayLabel}: ${summary.sessions_today || 0} chamada(s), ${summary.classes_pending_today || 0} turma(s) pendente(s), ${summary.teachers_active_today || 0} professor(es) com operação registrada.`;
            todayNote.textContent = `${summary.teachers_active_today || 0} professor(es) ativos hoje, ${summary.teachers_inactive_today || 0} sem registro e ${summary.classes_pending_today || 0} turma(s) pendente(s) com base na estrutura já sincronizada.`;

            if (!pendingClasses.length) {
                pendingChip.textContent = 'Em dia';
                pendingChip.className = 'chip ok';
                pendingList.innerHTML = `<div style="padding:14px; border-radius:18px; background:rgba(22,163,74,0.08); color:#166534; font-size:14px; line-height:1.5;">Nenhuma turma pendente para ${dayLabel}. A operação do dia está em dia nesta organização.</div>`;
                return;
            }

            pendingChip.textContent = `${pendingClasses.length} pendência(s)`;
            pendingChip.className = 'chip warn';
            pendingList.innerHTML = pendingClasses.map((entry) => `
                <div style="display:flex; justify-content:space-between; gap:12px; align-items:center; padding:12px 14px; border-radius:16px; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.14); margin-top:8px;">
                    <div style="display:grid; gap:4px;">
                        <strong style="font-size:15px; color:var(--text);">${escapeHtml(entry.class_name || 'Turma')}</strong>
                        <span class="small-note" style="color:var(--muted);">${escapeHtml(entry.school_name || 'Organização ativa')}</span>
                    </div>
                    <span class="chip warn">Sem chamada</span>
                </div>
            `).join('');
        }

        async function loadOrganizationDashboard() {
            const organizationId = state.memberships[0]?.organization?.id;
            if (!organizationId) {
                renderDashboard(null, null);
                renderOrganizationSessions([], null);
                renderOrganizationMembers([], null);
                renderOrganizationAssignments([], null);
                return;
            }

            const dashboard = await apiRequest(`/organizations/dashboard?organization_id=${organizationId}`);
            state.dashboardRecentSessions = dashboard.recent_sessions || [];
            state.dashboardRecentSummary = dashboard.recent_summary || null;
            renderDashboard(dashboard.summary || null, dashboard.day || null, dashboard.pending_classes_today || []);
            renderOrganizationSessions(state.dashboardRecentSessions, state.dashboardRecentSummary);
            await loadOrganizationMembers();
            await loadOrganizationAssignments();
            showMessage(`Pulso do dia carregado. ${dashboard.summary?.sessions_today || 0} chamada(s) registrada(s) hoje para a organização.`, 'success');
        }

        async function syncSessionState() {
            if (!state.token) {
                renderSessionCard();
                setAuthMessage('Ainda não há sessão institucional ativa neste navegador.', 'info');
                renderOrganizationSessions([], null);
                return;
            }

            try {
                const me = await apiRequest('/auth/me');
                const orgs = await apiRequest('/organizations/mine');
                state.user = me.user || state.user;
                state.memberships = orgs.memberships || [];
                persistAuth({ token: state.token, user: state.user, memberships: state.memberships });
                renderSessionCard();

                const firstOrg = state.memberships[0]?.organization?.name || 'organização vinculada';
                setAuthMessage(`Conectado como ${state.user?.name || state.user?.email || 'usuário institucional'}.`, 'success');
                await loadOrganizationDashboard();
                showMessage(`Acesso validado no backend. Organização atual: ${firstOrg}.`, 'success');
            } catch (error) {
                clearAuth();
                setAuthMessage(error.message || 'Não foi possível validar a sessão institucional.', 'error');
            }
        }

        window.addEventListener('DOMContentLoaded', async () => {
            document.getElementById('school-portal-logout').addEventListener('click', () => clearAuth());
            document.getElementById('org-class-create-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                if (state.classCreateBusy) {
                    return;
                }

                const name = document.getElementById('org-class-name').value.trim();
                const externalId = document.getElementById('org-class-external').value.trim();
                const shift = document.getElementById('org-class-shift').value.trim();

                try {
                    state.classCreateBusy = true;
                    setClassCreateMessage('Cadastrando turma no portal...', 'info');
                    const result = await createOrganizationClass({
                        name,
                        external_id: externalId,
                        shift
                    });
                    document.getElementById('org-class-name').value = '';
                    document.getElementById('org-class-external').value = '';
                    document.getElementById('org-class-shift').value = '';
                    setClassCreateMessage(`Turma ${result.class?.name || 'cadastrada'} disponível na estrutura institucional.`, 'success');
                    await loadOrganizationAssignments();
                    showMessage(`Turma ${result.class?.name || 'cadastrada'} salva no portal da organização.`, 'success');
                } catch (error) {
                    setClassCreateMessage(error.message || 'Não foi possível cadastrar a turma.', 'error');
                } finally {
                    state.classCreateBusy = false;
                }
            });
            document.getElementById('org-student-create-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                if (state.studentCreateBusy) {
                    return;
                }

                const organizationId = state.memberships[0]?.organization?.id;
                const classId = Number(document.getElementById('org-student-class').value || 0);
                const fullName = document.getElementById('org-student-name').value.trim();
                const enrollmentCode = document.getElementById('org-student-enrollment').value.trim();
                const externalId = document.getElementById('org-student-external').value.trim();

                if (!organizationId) {
                    setStudentCreateMessage('Organização indisponível neste navegador.', 'error');
                    return;
                }

                if (!classId) {
                    setStudentCreateMessage('Selecione a turma antes de cadastrar o aluno.', 'warn');
                    return;
                }

                if (!fullName) {
                    setStudentCreateMessage('Informe o nome do aluno.', 'warn');
                    return;
                }

                state.studentCreateBusy = true;
                try {
                    const result = await createOrganizationStudent({
                        organization_id: organizationId,
                        organization_class_id: classId,
                        full_name: fullName,
                        enrollment_code: enrollmentCode,
                        external_id: externalId
                    });
                    document.getElementById('org-student-name').value = '';
                    document.getElementById('org-student-enrollment').value = '';
                    document.getElementById('org-student-external').value = '';
                    setStudentCreateMessage(`Aluno ${result.student?.full_name || 'cadastrado'} incluído na turma ${result.class?.name || ''}. QR segue pendente para a etapa centralizada.`, 'success');
                    state.selectedStudentClassId = classId;
                    await loadOrganizationStudents(classId);
                    showMessage(`Aluno ${result.student?.full_name || 'cadastrado'} salvo na estrutura institucional.`, 'success');
                } catch (error) {
                    setStudentCreateMessage(error.message || 'Não foi possível cadastrar o aluno.', 'error');
                } finally {
                    state.studentCreateBusy = false;
                }
            });

            document.getElementById('org-student-class').addEventListener('change', async (event) => {
                state.selectedStudentClassId = Number(event.target.value || 0) || null;
                const importClass = document.getElementById('org-student-import-class');
                if (importClass && state.selectedStudentClassId) {
                    importClass.value = String(state.selectedStudentClassId);
                }
                await loadOrganizationStudents(state.selectedStudentClassId);
            });

            document.getElementById('org-student-import-class').addEventListener('change', (event) => {
                const selected = Number(event.target.value || 0) || null;
                if (selected) {
                    state.selectedStudentClassId = selected;
                    const createClass = document.getElementById('org-student-class');
                    if (createClass) {
                        createClass.value = String(selected);
                    }
                }
            });

            
            document.getElementById('org-student-generate-qrs').addEventListener('click', async () => {
                if (state.studentQrBusy) {
                    return;
                }

                const organizationId = state.memberships[0]?.organization?.id;
                const classId = Number(state.selectedStudentClassId || document.getElementById('org-student-class')?.value || 0);
                if (!organizationId) {
                    setStudentQrMessage('Organização indisponível neste navegador.', 'error');
                    return;
                }
                if (!classId) {
                    setStudentQrMessage('Selecione a turma antes de gerar o PDF de QR.', 'warn');
                    return;
                }
                if (!state.classStudents || !state.classStudents.length) {
                    setStudentQrMessage('Cadastre ou importe alunos nesta turma antes de gerar o kit.', 'warn');
                    return;
                }

                state.studentQrBusy = true;
                const button = document.getElementById('org-student-generate-qrs');
                const originalLabel = button.textContent;
                button.disabled = true;
                button.textContent = 'Gerando PDF...';
                setStudentQrMessage('Gerando os QR Codes da turma e preparando o PDF...', 'info');

                try {
                    const result = await generateOrganizationStudentQRCodes({
                        organization_id: organizationId,
                        organization_class_id: classId
                    });
                    await generateOrganizationQrPdf(result);
                    setStudentQrMessage(`Kit de QR gerado: ${result.summary?.ready_total || result.students?.length || 0} aluno(s) prontos para impressão.`, 'success');
                    showMessage(`PDF de QR Codes da turma ${result.class?.name || ''} gerado com sucesso.`, 'success');
                    await loadOrganizationStudents(classId);
                } catch (error) {
                    setStudentQrMessage(error.message || 'Não foi possível gerar o kit de QR Codes.', 'error');
                } finally {
                    state.studentQrBusy = false;
                    button.disabled = false;
                    button.textContent = originalLabel;
                }
            });

            document.getElementById('org-student-import-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                if (state.studentImportBusy) {
                    return;
                }

                const organizationId = state.memberships[0]?.organization?.id;
                const classId = Number(document.getElementById('org-student-import-class').value || 0);
                const fileInput = document.getElementById('org-student-import-file');
                const file = fileInput?.files?.[0];

                if (!organizationId) {
                    setStudentImportMessage('Organização indisponível neste navegador.', 'error');
                    return;
                }

                if (!classId) {
                    setStudentImportMessage('Selecione a turma da importação.', 'warn');
                    return;
                }

                if (!file) {
                    setStudentImportMessage('Selecione um arquivo CSV antes de importar.', 'warn');
                    return;
                }

                state.studentImportBusy = true;
                try {
                    const raw = await file.text();
                    const rows = parseDelimitedRows(raw);
                    if (!rows.length) {
                        throw new Error('Nenhum aluno válido foi encontrado no CSV.');
                    }

                    const result = await importOrganizationStudents({
                        organization_id: organizationId,
                        organization_class_id: classId,
                        rows
                    });

                    fileInput.value = '';
                    state.selectedStudentClassId = classId;
                    const summary = result.summary || {};
                    setStudentImportMessage(`Importação concluída: ${summary.imported || 0} importado(s), ${summary.skipped || 0} ignorado(s) e ${summary.errors || 0} erro(s).`, summary.errors ? 'warn' : 'success');
                    showMessage(`Base da turma ${result.class?.name || ''} atualizada via CSV.`, 'success');
                    await loadOrganizationStudents(classId);
                } catch (error) {
                    setStudentImportMessage(error.message || 'Não foi possível importar o CSV.', 'error');
                } finally {
                    state.studentImportBusy = false;
                }
            });

            document.getElementById('org-filters-form').addEventListener('submit', async (event) => {
                event.preventDefault();
                await loadOrganizationSessions(getOrganizationFilters());
            });
            document.getElementById('org-filters-clear').addEventListener('click', async () => {
                document.getElementById('org-filter-date-from').value = '';
                document.getElementById('org-filter-date-to').value = '';
                document.getElementById('org-filter-teacher').value = '';
                document.getElementById('org-filter-class').value = '';
                await loadOrganizationSessions({});
            });
            renderSessionCard();

            if (restoreAuth()) {
                await syncSessionState();
            } else {
                renderOrganizationSessions([], null);
                renderOrganizationMembers([], null);
                renderOrganizationAssignments([], null);
                setAuthMessage('Nenhuma sessão institucional ativa foi encontrada neste navegador.', 'info');
                showMessage('Faça o login institucional na tela de acesso e volte para cá. O portal passa a ler a organização automaticamente.', 'info');
            }
        });
    