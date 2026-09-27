import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties } from 'react'

const SRC = 'http://localhost:40000/api/Music/music/01a0ce78-090d-7f4a-9911-df77eaa53b36'

const fmt = (seconds: number): string => {
  if (!isFinite(seconds) || seconds < 0) seconds = 0
  return Math.floor(seconds / 60) + ':' + String(Math.floor(seconds % 60)).padStart(2, '0')
}

export default function Player() {
  const audioRef = useRef<HTMLAudioElement>(null)
  const seekingRef = useRef(false)

  const [src, setSrc] = useState<string | null>(null)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)
  const [progress, setProgress] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const render = (seconds: number) => {
    setCurrent(seconds)
    setProgress(duration ? (seconds / duration) * 1000 : 0)
  }

  useEffect(() => {
    let cancelled = false
    let objectUrl: string | null = null

    fetch(SRC)
      .then((r) => r.blob())
      .then((blob) => {
        if (cancelled) return
        objectUrl = URL.createObjectURL(blob)
        setSrc(objectUrl)
      })
      .catch(() => {
        if (!cancelled) setError('ошибка загрузки')
      })

    return () => {
      cancelled = true
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (audio.paused) audio.play().catch(() => setError('ошибка воспроизведения'))
    else audio.pause()
  }

  const onLoadedMetadata = () => {
    const audio = audioRef.current
    if (!audio) return
    setDuration(audio.duration)
    setCurrent(0)
    setProgress(0)
  }

  const onTimeUpdate = () => {
    const audio = audioRef.current
    if (!audio || seekingRef.current) return
    render(audio.currentTime)
  }

  const onSeeking = () => {
    seekingRef.current = true
  }

  const onSeeked = () => {
    const audio = audioRef.current
    seekingRef.current = false
    if (audio) render(audio.currentTime)
  }

  const onSeek = (e: ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const value = Number(e.target.value)
    setProgress(value)
    setCurrent((value / 1000) * duration)
    audio.currentTime = (value / 1000) * duration
  }

  return (
    <>
      <div className="player">
        <input
          type="range"
          className="progress"
          min={0}
          max={1000}
          value={progress}
          onChange={onSeek}
          style={{ '--p': progress / 10 } as CSSProperties}
        />

        <div className="time">
          <span>{fmt(current)}</span>
          <span>{error ?? fmt(duration)}</span>
        </div>

        <div className="controls">
          <button onClick={toggle}>{playing ? 'pause' : 'play'}</button>
        </div>
      </div>

      <audio
        ref={audioRef}
        src={src ?? undefined}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
        onLoadedMetadata={onLoadedMetadata}
        onError={() => setError('ошибка загрузки')}
        onTimeUpdate={onTimeUpdate}
        onSeeking={onSeeking}
        onSeeked={onSeeked}
      />
    </>
  )
}
