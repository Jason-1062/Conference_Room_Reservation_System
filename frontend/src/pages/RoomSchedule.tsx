import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api';
import dayjs from 'dayjs';
import type { RoomSchedule as RoomScheduleType } from '../types';

const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

function timeToPercent(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return ((h - 8) * 60 + m) / (15 * 60) * 100;
}

function timeToWidth(start: string, end: string): number {
  return timeToPercent(end) - timeToPercent(start);
}

function getWeekDays(date: string): string[] {
  const start = dayjs(date).startOf('week').add(1, 'day'); // Monday
  return Array.from({ length: 7 }, (_, i) => start.add(i, 'day').format('YYYY-MM-DD'));
}

export default function RoomSchedule() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [weekSchedules, setWeekSchedules] = useState<Record<string, RoomScheduleType>>({});
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roomName, setRoomName] = useState('');

  // For single room: use Monday of current week; for all rooms: single date
  const today = dayjs().format('YYYY-MM-DD');
  const monday = dayjs().startOf('week').add(1, 'day').format('YYYY-MM-DD');
  const [date, setDate] = useState(id ? monday : today);

  const weekDays = id ? getWeekDays(date) : [date];

  useEffect(() => {
    if (id) {
      loadSingleRoom();
    } else {
      loadRooms();
    }
  }, []);

  useEffect(() => {
    if (id) {
      loadWeekSchedules();
    } else if (rooms.length > 0) {
      loadDaySchedules();
    }
  }, [date, rooms, id]);

  const loadSingleRoom = async () => {
    try {
      const data = await api.getRooms();
      const room = data?.find((r: any) => r.id === Number(id));
      if (room) setRoomName(room.name);
    } catch { }
  };

  const loadRooms = async () => {
    try {
      const data = await api.getRooms();
      setRooms(data || []);
    } catch { }
  };

  const loadWeekSchedules = async () => {
    setLoading(true);
    try {
      const results: Record<string, RoomScheduleType> = {};
      await Promise.all(
        weekDays.map(async (d) => {
          results[d] = await api.getRoomSchedule(Number(id), d);
        })
      );
      setWeekSchedules(results);
    } catch { } finally { setLoading(false); }
  };

  const loadDaySchedules = async () => {
    setLoading(true);
    try {
      const results = await Promise.all(
        rooms.map((r: any) => api.getRoomSchedule(r.id, date))
      );
      // Store all-room view using date as key
      const map: Record<string, RoomScheduleType> = {};
      map[date] = results as any;
      setWeekSchedules(map);
    } catch { } finally { setLoading(false); }
  };

  const changeDate = (delta: number) => {
    setDate(prev => {
      if (id) {
        return dayjs(prev).add(delta * 7, 'day').format('YYYY-MM-DD');
      }
      return dayjs(prev).add(delta, 'day').format('YYYY-MM-DD');
    });
  };

  if (loading) return <div className="page-loading">加载中...</div>;

  // All-rooms single-day view
  if (!id) {
    const dayData = (weekSchedules[date] as any) || [];
    return (
      <div className="page">
        <div className="page-header">
          <div>
            <h1>会议室时段总览</h1>
            <p className="page-desc">开放时间 08:00 - 23:00</p>
          </div>
          <button className="btn btn-secondary" onClick={() => navigate('/rooms')}>返回列表</button>
        </div>

        <div className="schedule-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button className="btn btn-sm btn-secondary" onClick={() => changeDate(-1)}>◀ 前一天</button>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              style={{ padding: '8px 14px', fontSize: '0.9rem' }} />
            <button className="btn btn-sm btn-secondary" onClick={() => changeDate(1)}>后一天 ▶</button>
            <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>
              {dayjs(date).format('YYYY年MM月DD日 dddd')}
            </span>
          </div>
          <div className="schedule-legend">
            <div className="legend-item"><span className="legend-dot free" /> 空闲</div>
            <div className="legend-item"><span className="legend-dot reserved" /> 已预约</div>
            <div className="legend-item"><span className="legend-dot pending" /> 待审批</div>
            <div className="legend-item"><span className="legend-dot maintenance" /> 维护中</div>
          </div>
        </div>

        <div className="card">
          <div className="schedule-hour-labels">
            {HOURS.map(h => <div key={h} className="schedule-hour-label">{String(h).padStart(2, '0')}:00</div>)}
          </div>
          <div className="schedule-rows">
            {Array.isArray(dayData) && dayData.map((s: any, i: number) => (
              <div key={i} className="schedule-row">
                <div className="schedule-room-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span>{s.roomName}</span>
                  {s.roomStatus === 'Maintenance' && <span style={{ fontSize: '0.68rem', color: '#fca5a5' }}>维护中</span>}
                </div>
                <div className="schedule-timeline">
                  {s.schedule.map((block: any, j: number) => (
                    <div key={j} className={`schedule-block ${block.status}`}
                      style={{
                        marginLeft: j === 0 ? `${timeToPercent(block.start)}%` : '0',
                        width: `${timeToWidth(block.start, block.end)}%`,
                      }}
                      title={`${block.start}-${block.end} ${block.title}${block.username ? ` (${block.username})` : ''}`}
                    >
                      {timeToWidth(block.start, block.end) > 8 && (
                        <span style={{ padding: '0 4px' }}>
                          {block.status === 'free' ? '' : `${block.start}-${block.end} ${block.title}`}
                        </span>
                      )}
                      {(block.status === 'reserved' || block.status === 'pending') && block.username && (
                        <div className="schedule-block-tooltip">
                          {block.title} ({block.username})<br />{block.start} - {block.end}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Single-room 7-day view
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{roomName || '会议室'}</h1>
          <p className="page-desc">
            开放时间 08:00 - 23:00
            <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>
              {dayjs(date).startOf('week').add(1, 'day').format('MM月DD日')} - {dayjs(date).startOf('week').add(7, 'day').format('MM月DD日')}
            </span>
          </p>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/rooms')}>返回列表</button>
      </div>

      <div className="schedule-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button className="btn btn-sm btn-secondary" onClick={() => changeDate(-1)}>◀ 上一周</button>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ padding: '8px 14px', fontSize: '0.9rem' }} />
          <button className="btn btn-sm btn-secondary" onClick={() => changeDate(1)}>下一周 ▶</button>
        </div>
        <div className="schedule-legend">
          <div className="legend-item"><span className="legend-dot free" /> 空闲</div>
          <div className="legend-item"><span className="legend-dot reserved" /> 已预约</div>
          <div className="legend-item"><span className="legend-dot pending" /> 待审批</div>
          <div className="legend-item"><span className="legend-dot maintenance" /> 维护中</div>
        </div>
      </div>

      <div className="card">
        <div className="schedule-hour-labels">
          {HOURS.map(h => <div key={h} className="schedule-hour-label">{String(h).padStart(2, '0')}:00</div>)}
        </div>

        <div className="schedule-rows">
          {weekDays.map((day) => {
            const s = weekSchedules[day];
            return (
              <div key={day} className="schedule-row">
                <div className="schedule-room-label" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span style={{ fontSize: '0.8rem' }}>{dayjs(day).format('dd')}</span>
                  <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>{dayjs(day).format('MM/DD')}</span>
                </div>
                <div className="schedule-timeline">
                  {s ? (
                    s.schedule.map((block, j) => (
                      <div key={j} className={`schedule-block ${block.status}`}
                        style={{
                          marginLeft: j === 0 ? `${timeToPercent(block.start)}%` : '0',
                          width: `${timeToWidth(block.start, block.end)}%`,
                        }}
                        title={`${block.start}-${block.end} ${block.title}${block.username ? ` (${block.username})` : ''}`}
                      >
                        {timeToWidth(block.start, block.end) > 8 && (
                          <span style={{ padding: '0 4px' }}>
                            {block.status === 'free' ? '' : `${block.start}-${block.end} ${block.title}`}
                          </span>
                        )}
                        {(block.status === 'reserved' || block.status === 'pending') && block.username && (
                          <div className="schedule-block-tooltip">
                            {block.title} ({block.username})<br />{block.start} - {block.end}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.78rem' }}>
                      无数据
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
