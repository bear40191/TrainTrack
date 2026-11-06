import { create } from 'zustand';
import { Profile, Role, WorkLog, AppNotification, ApprovalAction, Comment as AppComment } from '@/lib/types';
import { DEFAULT_CATEGORIES } from '@/lib/constants';
import {
  notifyMentorPendingReview,
  notifyLeadPendingApproval,
  notifyTraineeApproved,
  notifyTraineeRevisionRequired,
} from '@/services/emailNotification';

// Mock email ของ Lead (ใช้ตอนยังไม่มี backend จริง)
const MOCK_LEAD_EMAIL = 'veera.lead@traintrack.app';

// รายชื่อพี่เลี้ยงหลายคน (Mentor List)
export const MOCK_MENTORS: Profile[] = [
  {
    id: 'user-mentor-1',
    full_name: 'พี่สมชาย ชูใจ (พี่เลี้ยงฝั่ง Frontend)',
    email: 'somchai.frontend@traintrack.app',
    role: 'mentor',
    team_id: 'team-mobile-1',
    mentor_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    position: 'Senior Frontend Developer',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-mentor-2',
    full_name: 'พี่วิภาดา ศรีกุล (พี่เลี้ยงฝั่ง Backend & Database)',
    email: 'vipada.backend@traintrack.app',
    role: 'mentor',
    team_id: 'team-mobile-1',
    mentor_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
    position: 'Lead Backend Engineer',
    created_at: new Date().toISOString(),
  },
  {
    id: 'user-mentor-3',
    full_name: 'พี่อานนท์ มั่นคง (พี่เลี้ยงฝั่ง DevOps & Native Plugin)',
    email: 'arnon.devops@traintrack.app',
    role: 'mentor',
    team_id: 'team-mobile-1',
    mentor_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    position: 'DevOps & Mobile Specialist',
    created_at: new Date().toISOString(),
  },
];


export const MOCK_USERS: Record<Role, Profile> = {
  trainee: {
    id: 'user-trainee-1',
    full_name: 'กิตติศักดิ์ พัฒนาดี (นักศึกษาฝึกงาน)',
    email: 'kittisak.trainee@traintrack.app',
    role: 'trainee',
    team_id: 'team-mobile-1',
    mentor_id: 'user-mentor-1',
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
    created_at: new Date().toISOString(),
  },
  mentor: MOCK_MENTORS[0],
  lead: {
    id: 'user-lead-1',
    full_name: 'หัวหน้าวีระ ชัยชนะ (หัวหน้าพี่เลี้ยง)',
    email: 'veera.lead@traintrack.app',
    role: 'lead',
    team_id: 'team-mobile-1',
    mentor_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
    created_at: new Date().toISOString(),
  },
  admin: {
    id: 'user-admin-1',
    full_name: 'ผู้ดูแลระบบสูงสุด (System Admin)',
    email: 'admin@traintrack.app',
    role: 'admin',
    team_id: null,
    mentor_id: null,
    avatar_url: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150',
    created_at: new Date().toISOString(),
  },
};

export const ALL_DEMO_USERS: Profile[] = [
  MOCK_USERS.trainee,
  ...MOCK_MENTORS,
  MOCK_USERS.lead,
  MOCK_USERS.admin,
];

const INITIAL_LOGS: WorkLog[] = [
  {
    id: 'log-1',
    trainee_id: 'user-trainee-1',
    assigned_mentor_id: 'user-mentor-3',
    work_date: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    title: 'ศึกษาโครงสร้าง Capacitor และทำความเข้าใจ Native Plugin',
    description: 'ได้ลองทดสอบติดตั้ง Camera plugin และ Geolocation บนระบบจำลอง Android พร้อมจดสรุปข้อจำกัดเรื่อง Permission',
    hours_spent: 7,
    status: 'approved',
    category: 'ค้นคว้าข้อมูล/เรียนรู้',
    revision_count: 0,
    submitted_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    approved_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    updated_at: new Date(Date.now() - 86400000 * 1).toISOString(),
    trainee: MOCK_USERS.trainee,
    assigned_mentor: MOCK_MENTORS[2],
    attachments: [
      {
        id: 'att-1',
        work_log_id: 'log-1',
        file_name: 'capacitor_test_screenshot.png',
        file_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=600',
        file_type: 'image',
        file_size: 1024 * 450,
        created_at: new Date().toISOString()
      }
    ],
    comments: [
      {
        id: 'c-1',
        work_log_id: 'log-1',
        author_id: 'user-mentor-3',
        content: 'พี่อานนท์ตรวจแล้ว สรุปได้ละเอียดดีมากครับ ส่งต่อให้หัวหน้า',
        is_system: false,
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        author: MOCK_MENTORS[2]
      },
      {
        id: 'c-2',
        work_log_id: 'log-1',
        author_id: 'user-lead-1',
        content: 'อนุมัติเรียบร้อย เริ่มลงมือเขียนโค้ดจริงในสปรินต์นี้ได้เลย',
        is_system: false,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        author: MOCK_USERS.lead
      }
    ],
    approval_actions: [
      {
        id: 'act-1',
        work_log_id: 'log-1',
        actor_id: 'user-trainee-1',
        action: 'submit',
        from_status: 'draft',
        to_status: 'pending_mentor',
        note: null,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        actor: MOCK_USERS.trainee
      },
      {
        id: 'act-2',
        work_log_id: 'log-1',
        actor_id: 'user-mentor-3',
        action: 'approve',
        from_status: 'pending_mentor',
        to_status: 'pending_lead',
        note: 'ผ่านเกณฑ์เรียบร้อย',
        created_at: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        actor: MOCK_MENTORS[2]
      },
      {
        id: 'act-3',
        work_log_id: 'log-1',
        actor_id: 'user-lead-1',
        action: 'approve',
        from_status: 'pending_lead',
        to_status: 'approved',
        note: 'อนุมัติขั้นสุดท้าย',
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        actor: MOCK_USERS.lead
      }
    ]
  },
  {
    id: 'log-2',
    trainee_id: 'user-trainee-1',
    assigned_mentor_id: 'user-mentor-1',
    work_date: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    title: 'เชื่อมต่อหน้าเข้าสู่ระบบและสร้างหน้าบันทึกประจำวัน',
    description: 'เขียนฟอร์มบันทึกการทำงาน เพิ่มระบบอัปโหลดรูปภาพตัวอย่าง และจัดการสถานะฟอร์มตามที่กำหนด',
    hours_spent: 8,
    status: 'pending_mentor',
    category: 'พัฒนาระบบ (Development)',
    revision_count: 0,
    submitted_at: new Date(Date.now() - 86400000).toISOString(),
    approved_at: null,
    created_at: new Date(Date.now() - 86400000).toISOString(),
    updated_at: new Date(Date.now() - 86400000).toISOString(),
    trainee: MOCK_USERS.trainee,
    assigned_mentor: MOCK_MENTORS[0],
    attachments: [],
    comments: [],
    approval_actions: [
      {
        id: 'act-2-1',
        work_log_id: 'log-2',
        actor_id: 'user-trainee-1',
        action: 'submit',
        from_status: 'draft',
        to_status: 'pending_mentor',
        note: null,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        actor: MOCK_USERS.trainee
      }
    ]
  }
];

interface AppState {
  currentUser: Profile;
  mentors: Profile[];
  workLogs: WorkLog[];
  categories: string[];
  notifications: AppNotification[];
  isAuthenticated: boolean;
  login: (email: string, password?: string) => boolean;
  logout: () => void;
  // Actions
  switchRole: (role: Role, mentorId?: string) => void;
  selectSpecificMentor: (mentorId: string) => void;
  addCategory: (name: string) => void;
  removeCategory: (name: string) => void;
  createWorkLog: (log: Omit<WorkLog, 'id' | 'created_at' | 'updated_at' | 'revision_count' | 'trainee'>) => void;
  updateWorkLog: (id: string, updates: Partial<WorkLog>) => void;
  submitWorkLog: (id: string) => void;
  mentorApprove: (id: string, note?: string) => void;
  mentorReject: (id: string, note: string) => void;
  leadApprove: (id: string, note?: string) => void;
  leadReject: (id: string, note: string) => void;
  addComment: (logId: string, content: string) => void;
  markNotificationAsRead: (id: string) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  isAuthenticated: true,

  login: (email: string, password?: string) => {
    // สามารถใช้ password ในการตรวจสอบได้ในอนาคต
    if (password && password.length < 1) return false;
    const trimmed = email.trim().toLowerCase();
    const found = ALL_DEMO_USERS.find(
      (u) => u.email.toLowerCase() === trimmed
    );
    if (found) {
      set({ currentUser: found, isAuthenticated: true });
      return true;
    }
    // Match by keywords if typed loosely
    if (trimmed.includes('trainee') || trimmed.includes('นักศึกษา')) {
      set({ currentUser: MOCK_USERS.trainee, isAuthenticated: true });
      return true;
    }
    if (trimmed.includes('somchai') || trimmed.includes('frontend')) {
      set({ currentUser: MOCK_MENTORS[0], isAuthenticated: true });
      return true;
    }
    if (trimmed.includes('vipada') || trimmed.includes('backend')) {
      set({ currentUser: MOCK_MENTORS[1], isAuthenticated: true });
      return true;
    }
    if (trimmed.includes('arnon') || trimmed.includes('devops')) {
      set({ currentUser: MOCK_MENTORS[2], isAuthenticated: true });
      return true;
    }
    if (trimmed.includes('lead') || trimmed.includes('หัวหน้า')) {
      set({ currentUser: MOCK_USERS.lead, isAuthenticated: true });
      return true;
    }
    if (trimmed.includes('admin') || trimmed.includes('ผู้ดูแล')) {
      set({ currentUser: MOCK_USERS.admin, isAuthenticated: true });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ isAuthenticated: false });
  },
  currentUser: MOCK_USERS.trainee,
  mentors: MOCK_MENTORS,
  workLogs: INITIAL_LOGS,
  categories: DEFAULT_CATEGORIES,
  notifications: [
    {
      id: 'notif-1',
      user_id: 'user-trainee-1',
      title: 'งานได้รับการอนุมัติแล้ว',
      body: 'งาน "ศึกษาโครงสร้าง Capacitor" ได้รับการอนุมัติขั้นสุดท้ายจากหัวหน้าพี่เลี้ยงแล้ว',
      type: 'approval',
      reference_id: 'log-1',
      is_read: false,
      created_at: new Date().toISOString()
    }
  ],

  switchRole: (role: Role, mentorId?: string) => {
    if (role === 'mentor') {
      const targetMentor = get().mentors.find(m => m.id === (mentorId || 'user-mentor-1')) || get().mentors[0];
      set({ currentUser: targetMentor });
    } else {
      set({ currentUser: MOCK_USERS[role] });
    }
  },

  selectSpecificMentor: (mentorId: string) => {
    const target = get().mentors.find(m => m.id === mentorId);
    if (target) {
      set({ currentUser: target });
    }
  },

  addCategory: (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.categories.includes(trimmed)) return state;
      return { categories: [...state.categories, trimmed] };
    });
  },

  removeCategory: (name: string) => {
    set((state) => ({
      categories: state.categories.filter((c) => c !== name)
    }));
  },

  createWorkLog: (logData) => {
    const user = get().currentUser;
    const assignedMentor = get().mentors.find(m => m.id === logData.assigned_mentor_id) || get().mentors[0];

    const newLog: WorkLog = {
      ...logData,
      id: 'log-' + Date.now(),
      trainee_id: user.id,
      revision_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      trainee: user,
      assigned_mentor: assignedMentor,
      attachments: logData.attachments || [],
      comments: [],
      approval_actions: [
        {
          id: 'action-' + Date.now(),
          work_log_id: 'log-' + Date.now(),
          actor_id: user.id,
          action: 'submit',
          from_status: 'draft',
          to_status: logData.status,
          note: null,
          created_at: new Date().toISOString(),
          actor: user
        }
      ]
    };


    // ส่ง email แจ้งพี่เลี้ยง (fire-and-forget — ไม่ block UI)
    if (logData.status === 'pending_mentor') {
      notifyMentorPendingReview(assignedMentor, user, newLog.title);
    }
    set((state) => ({
      workLogs: [newLog, ...state.workLogs],
      notifications: logData.status === 'pending_mentor' ? [
        {
          id: 'notif-' + Date.now(),
          user_id: assignedMentor.id,
          title: 'มีงานใหม่มอบหมายถึงคุณ',
          body: `${user.full_name} ได้ส่งบันทึกงาน: "${newLog.title}" เพื่อให้คุณตรวจสอบ`,
          type: 'approval',
          reference_id: newLog.id,
          is_read: false,
          created_at: new Date().toISOString()
        },
        ...state.notifications
      ] : state.notifications
    }));
  },

  updateWorkLog: (id, updates) => {
    set((state) => ({
      workLogs: state.workLogs.map((log) =>
        log.id === id ? { ...log, ...updates, updated_at: new Date().toISOString() } : log
      )
    }));
  },

  submitWorkLog: (id) => {
    const user = get().currentUser;
    set((state) => {
      const target = state.workLogs.find((l) => l.id === id);
      if (!target) return state;

      const mentorToNotify = target.assigned_mentor_id || 'user-mentor-1';
      // email call in submitWorkLog
      if (target.assigned_mentor) {
        notifyMentorPendingReview(target.assigned_mentor, user, target.title);
      }

      const newAction: ApprovalAction = {
        id: 'action-' + Date.now(),
        work_log_id: id,
        actor_id: user.id,
        action: 'submit',
        from_status: target.status,
        to_status: 'pending_mentor',
        note: 'ส่งงานให้พี่เลี้ยงตรวจ',
        created_at: new Date().toISOString(),
        actor: user
      };

      const newNotif: AppNotification = {
        id: 'notif-' + Date.now(),
        user_id: mentorToNotify,
        title: 'มีงานส่งตรวจใหม่',
        body: `${user.full_name} ส่งบันทึกงาน "${target.title}" เพื่อรออนุมัติ`,
        type: 'approval',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      return {
        workLogs: state.workLogs.map((log) =>
          log.id === id
            ? {
              ...log,
              status: 'pending_mentor',
              submitted_at: new Date().toISOString(),
              approval_actions: [...(log.approval_actions || []), newAction]
            }
            : log
        ),
        notifications: [newNotif, ...state.notifications]
      };
    });
  },

  mentorApprove: (id, note) => {
    const user = get().currentUser;
    set((state) => {
      const target = state.workLogs.find((l) => l.id === id);
      if (!target) return state;

      const action: ApprovalAction = {
        id: 'act-' + Date.now(),
        work_log_id: id,
        actor_id: user.id,
        action: 'approve',
        from_status: 'pending_mentor',
        to_status: 'pending_lead',
        note: note || `ตรวจสอบโดย ${user.full_name} ส่งต่อให้หัวหน้าพี่เลี้ยง`,
        created_at: new Date().toISOString(),
        actor: user
      };

      const notifyLead: AppNotification = {
        id: 'notif-lead-' + Date.now(),
        user_id: 'user-lead-1',
        title: 'มีงานผ่านการตรวจจากพี่เลี้ยงแล้ว',
        body: `งาน "${target.title}" ของ ${target.trainee?.full_name || 'นักศึกษา'} รอยืนยันขั้นสุดท้าย (ตรวจโดย ${user.full_name})`,
        type: 'approval',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      // email call in mentorApprove
      const leadProfile = { email: MOCK_LEAD_EMAIL, full_name: 'หัวหน้าพี่เลี้ยง' };
      if (target.trainee) {
        notifyLeadPendingApproval(leadProfile, target.trainee, user, target.title);
      }

      const notifyTrainee: AppNotification = {
        id: 'notif-trainee-' + Date.now(),
        user_id: target.trainee_id,
        title: 'พี่เลี้ยงตรวจงานเรียบร้อยแล้ว',
        body: `งาน "${target.title}" ของคุณผ่านการตรวจจาก ${user.full_name} แล้ว และส่งไปยังหัวหน้าพี่เลี้ยง`,
        type: 'approval',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      return {
        workLogs: state.workLogs.map((log) =>
          log.id === id
            ? {
              ...log,
              status: 'pending_lead',
              approval_actions: [...(log.approval_actions || []), action]
            }
            : log
        ),
        notifications: [notifyLead, notifyTrainee, ...state.notifications]
      };
    });
  },

  mentorReject: (id, note) => {
    const user = get().currentUser;
    set((state) => {
      const target = state.workLogs.find((l) => l.id === id);
      if (!target) return state;

      const action: ApprovalAction = {
        id: 'act-' + Date.now(),
        work_log_id: id,
        actor_id: user.id,
        action: 'request_revision',
        from_status: 'pending_mentor',
        to_status: 'revision_required',
        note: note,
        created_at: new Date().toISOString(),
        actor: user
      };

      // email call in mentorReject
      if (target.trainee) {
        notifyTraineeRevisionRequired(target.trainee, user, target.title, note);
      }

      // email call in mentorReject
      if (target.trainee) {
        notifyTraineeRevisionRequired(target.trainee, user, target.title, note);
      }

      const notifyTrainee: AppNotification = {
        id: 'notif-reject-' + Date.now(),
        user_id: target.trainee_id,
        title: 'งานต้องได้รับการแก้ไข',
        body: `${user.full_name} ส่งงาน "${target.title}" กลับมาแก้ไข: "${note}"`,
        type: 'revision',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      return {
        workLogs: state.workLogs.map((log) =>
          log.id === id
            ? {
              ...log,
              status: 'revision_required',
              revision_count: (log.revision_count || 0) + 1,
              approval_actions: [...(log.approval_actions || []), action]
            }
            : log
        ),
        notifications: [notifyTrainee, ...state.notifications]
      };
    });
  },

  leadApprove: (id, note) => {
    const user = get().currentUser;
    set((state) => {
      const target = state.workLogs.find((l) => l.id === id);
      if (!target) return state;

      const action: ApprovalAction = {
        id: 'act-' + Date.now(),
        work_log_id: id,
        actor_id: user.id,
        action: 'approve',
        from_status: 'pending_lead',
        to_status: 'approved',
        note: note || 'อนุมัติเรียบร้อย',
        created_at: new Date().toISOString(),
        actor: user
      };

      // email call in leadApprove
      if (target.trainee) {
        notifyTraineeApproved(target.trainee, target.title, note);
      }

      // email call in leadApprove
      if (target.trainee) {
        notifyTraineeApproved(target.trainee, target.title, note);
      }

      const notifyTrainee: AppNotification = {
        id: 'notif-approved-' + Date.now(),
        user_id: target.trainee_id,
        title: 'งานได้รับการอนุมัติสำเร็จ',
        body: `หัวหน้าพี่เลี้ยงอนุมัติงาน "${target.title}" เรียบร้อยแล้ว`,
        type: 'approval',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      return {
        workLogs: state.workLogs.map((log) =>
          log.id === id
            ? {
              ...log,
              status: 'approved',
              approved_at: new Date().toISOString(),
              approval_actions: [...(log.approval_actions || []), action]
            }
            : log
        ),
        notifications: [notifyTrainee, ...state.notifications]
      };
    });
  },

  leadReject: (id, note) => {
    const user = get().currentUser;
    set((state) => {
      const target = state.workLogs.find((l) => l.id === id);
      if (!target) return state;

      const action: ApprovalAction = {
        id: 'act-' + Date.now(),
        work_log_id: id,
        actor_id: user.id,
        action: 'request_revision',
        from_status: 'pending_lead',
        to_status: 'revision_required',
        note: note,
        created_at: new Date().toISOString(),
        actor: user
      };

      const notifyTrainee: AppNotification = {
        id: 'notif-lead-reject-' + Date.now(),
        user_id: target.trainee_id,
        title: 'งานต้องแก้ไขโดยหัวหน้าพี่เลี้ยง',
        body: `หัวหน้าพี่เลี้ยงแจ้งแก้ไข "${target.title}": "${note}"`,
        type: 'revision',
        reference_id: id,
        is_read: false,
        created_at: new Date().toISOString()
      };

      return {
        workLogs: state.workLogs.map((log) =>
          log.id === id
            ? {
              ...log,
              status: 'revision_required',
              revision_count: (log.revision_count || 0) + 1,
              approval_actions: [...(log.approval_actions || []), action]
            }
            : log
        ),
        notifications: [notifyTrainee, ...state.notifications]
      };
    });
  },

  addComment: (logId, content) => {
    const user = get().currentUser;
    const comment: AppComment = {
      id: 'cmt-' + Date.now(),
      work_log_id: logId,
      author_id: user.id,
      content,
      is_system: false,
      created_at: new Date().toISOString(),
      author: user
    };

    set((state) => ({
      workLogs: state.workLogs.map((log) =>
        log.id === logId
          ? { ...log, comments: [...(log.comments || []), comment] }
          : log
      )
    }));
  },

  markNotificationAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, is_read: true } : n
      )
    }));
  }
}));
