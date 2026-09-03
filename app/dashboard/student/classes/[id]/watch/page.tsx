'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Maximize2, RotateCw, Volume2, VolumeX, Play, Pause, SkipBack, SkipForward, Settings, AlertCircle } from 'lucide-react'
import { useApi, apiPost } from '@/lib/client'
import { PageHeading, Skeleton, Card, Badge } from '@/components/ui/kit'
import { Modal, useToast } from '@/components/ui/interactive'
import { Field, Textarea } from '@/components/ui/form'

interface Lesson {
  id: string
  title: string
  customTitle: string | null
  recordingLink: string
  week: number
  session: number
}

interface LessonData {
  lesson: Lesson
  attendanceStatus: string | null
  attendanceId: string | null
  recordingWatched: boolean
}

export default function WatchRecording() {
  const params = useParams()
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(1)
  const [isMuted, setIsMuted] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1)
  const [showControls, setShowControls] = useState(true)
  const [orientation, setOrientation] = useState<'landscape' | 'portrait'>('landscape')
  const [watchProgress, setWatchProgress] = useState(0)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  const [appealOpen, setAppealOpen] = useState(false)
  const [appealReason, setAppealReason] = useState('')
  const [appealBusy, setAppealBusy] = useState(false)
  const [isMarkedWatched, setIsMarkedWatched] = useState(false)
  const [markingWatched, setMarkingWatched] = useState(false)

  const { data, loading: apiLoading, error: apiError, refetch } = useApi<LessonData>(
    `/api/student/classes?lessonId=${params.id}`
  )

  useEffect(() => {
    if (data?.lesson) {
      setLesson(data.lesson)
      setIsMarkedWatched(data.recordingWatched || false)
      setLoading(false)
    }
    if (apiError) {
      setError(apiError instanceof Error ? apiError.message : 'Failed to load lesson')
      setLoading(false)
    }
  }, [data, apiError])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
      const progress = (video.currentTime / video.duration) * 100
      setWatchProgress(progress)
    }
    const handleLoadedMetadata = () => setDuration(video.duration)
    const handleEnded = () => {
      setIsPlaying(false)
      // Mark recording as watched when video ends
      markRecordingWatched(100, true)
    }

    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  // Periodically update watch progress
  useEffect(() => {
    if (!isPlaying) return

    const interval = setInterval(() => {
      if (watchProgress < 100) {
        markRecordingWatched(watchProgress, false)
      }
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [isPlaying, watchProgress])

  const markRecordingWatched = async (progress: number, completed: boolean) => {
    try {
      await apiPost('/api/student/recording/watch', {
        lessonId: params.id,
        attendanceId: data?.attendanceId || undefined,
        progress,
        completed,
      })
      if (completed) {
        setIsMarkedWatched(true)
        // Refetch to get the updated recordingWatched status from the server
        await refetch()
      }
    } catch (error) {
      console.error('Failed to mark recording progress:', error)
    }
  }

  const submitAppeal = async () => {
    if (!data?.attendanceId || !appealReason.trim()) return
    setAppealBusy(true)
    try {
      await apiPost('/api/student/appeals', {
        attendanceId: data.attendanceId,
        lessonId: params.id,
        reason: appealReason,
      })
      push('Appeal submitted successfully')
      setAppealOpen(false)
      setAppealReason('')
    } catch (e) {
      push(e instanceof Error ? e.message : 'Could not submit appeal', 'error')
    } finally {
      setAppealBusy(false)
    }
  }

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
    } else {
      video.play()
    }
    setIsPlaying(!isPlaying)
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const time = parseFloat(e.target.value)
    video.currentTime = time
    setCurrentTime(time)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return

    const newVolume = parseFloat(e.target.value)
    video.volume = newVolume
    setVolume(newVolume)
    setIsMuted(newVolume === 0)
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    if (isMuted) {
      video.volume = volume
      setIsMuted(false)
    } else {
      video.volume = 0
      setIsMuted(true)
    }
  }

  const skip = (seconds: number) => {
    const video = videoRef.current
    if (!video) return

    video.currentTime = Math.max(0, Math.min(duration, video.currentTime + seconds))
  }

  const changeSpeed = (speed: number) => {
    const video = videoRef.current
    if (!video) return

    video.playbackRate = speed
    setPlaybackSpeed(speed)
  }

  const toggleFullscreen = () => {
    const container = videoRef.current?.parentElement
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
      setIsFullscreen(true)
    } else {
      document.exitFullscreen()
      setIsFullscreen(false)
    }
  }

  const toggleOrientation = () => {
    setOrientation(prev => prev === 'landscape' ? 'portrait' : 'landscape')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isEmbeddable = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be') || url.includes('vimeo.com') || url.includes('drive.google.com')
  }

  const isGoogleDrive = (url: string) => {
    return url.includes('drive.google.com')
  }

  const getEmbedUrl = (url: string) => {
    // Handle Google Drive URLs
    if (url.includes('drive.google.com')) {
      const fileId = url.match(/\/d\/([a-zA-Z0-9_-]+)/)?.[1]
      if (fileId) {
        return `https://drive.google.com/file/d/${fileId}/preview`
      }
    }
    // Handle YouTube URLs
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)
      return videoId ? `https://www.youtube.com/embed/${videoId[1]}` : url
    }
    if (url.includes('vimeo.com')) {
      const videoId = url.match(/vimeo\.com\/(\d+)/)
      return videoId ? `https://player.vimeo.com/video/${videoId[1]}` : url
    }
    return url
  }

  if (loading || apiLoading) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeading
          eyebrow="Classes"
          title="Watch Recording"
          description="Loading video..."
        />
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <PageHeading
          eyebrow="Classes"
          title="Watch Recording"
          description="Video not found"
          action={
            <button onClick={() => router.back()} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2">
              <ArrowLeft size={16} /> Go Back
            </button>
          }
        />
        <Card className="p-8 text-center">
          <p className="text-muted-foreground">{error || 'Recording not found'}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHeading
        eyebrow="Classes"
        title={lesson.customTitle || lesson.title}
        description={`Week ${lesson.week} - Session ${lesson.session}`}
        action={
          <button onClick={() => router.back()} className="rounded-full border border-border px-4 py-2 text-sm hover:bg-secondary flex items-center gap-2">
            <ArrowLeft size={16} /> Back to Classes
          </button>
        }
      />

      <div className="max-w-6xl mx-auto p-6">
        <Card className={`overflow-hidden ${orientation === 'portrait' ? 'max-w-md mx-auto' : ''}`}>
          <div 
            className={`relative bg-black group ${orientation === 'portrait' ? 'aspect-[9/16]' : 'aspect-video'}`}
            onMouseEnter={() => setShowControls(true)}
            onMouseLeave={() => setShowControls(false)}
          >
            {isGoogleDrive(lesson.recordingLink) ? (
              <iframe
                src={getEmbedUrl(lesson.recordingLink)}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={lesson.customTitle || lesson.title}
              />
            ) : isEmbeddable(lesson.recordingLink) ? (
              <iframe
                src={getEmbedUrl(lesson.recordingLink)}
                className="w-full h-full"
                allow="autoplay; fullscreen"
                allowFullScreen
                title={lesson.customTitle || lesson.title}
              />
            ) : (
              <>
                <video
                  ref={videoRef}
                  src={lesson.recordingLink}
                  className="w-full h-full object-contain"
                  onClick={togglePlay}
                />

                {/* Custom Controls */}
                <div 
                  className={`absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 transition-opacity ${
                    showControls ? 'opacity-100' : 'opacity-0'
                  }`}
                >
                  {/* Progress Bar */}
                  <div className="mb-3">
                    <input
                      type="range"
                      min="0"
                      max={duration}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                    />
                    <div className="flex justify-between text-xs text-white mt-1">
                      <span>{formatTime(currentTime)}</span>
                      <span>{formatTime(duration)}</span>
                    </div>
                  </div>

                  {/* Control Buttons */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <button onClick={togglePlay} className="text-white hover:text-white/80 transition">
                        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                      </button>
                      <button onClick={() => skip(-10)} className="text-white hover:text-white/80 transition">
                        <SkipBack size={20} />
                      </button>
                      <button onClick={() => skip(10)} className="text-white hover:text-white/80 transition">
                        <SkipForward size={20} />
                      </button>
                      <div className="flex items-center gap-2 ml-4">
                        <button onClick={toggleMute} className="text-white hover:text-white/80 transition">
                          {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                        </button>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.1"
                          value={isMuted ? 0 : volume}
                          onChange={handleVolumeChange}
                          className="w-20 h-1 bg-white/30 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2 [&::-webkit-slider-thumb]:h-2 [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:rounded-full"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <button 
                          onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                          className="text-white hover:text-white/80 transition"
                        >
                          <Settings size={20} />
                        </button>
                        {showSpeedMenu && (
                          <div className="absolute bottom-full right-0 mb-2 bg-black/90 rounded-lg p-2 min-w-[120px]">
                            {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                              <button
                                key={speed}
                                onClick={() => {
                                  changeSpeed(speed)
                                  setShowSpeedMenu(false)
                                }}
                                className={`block w-full text-left px-2 py-1 text-xs text-white hover:bg-white/20 rounded ${
                                  playbackSpeed === speed ? 'bg-white/20' : ''
                                }`}
                              >
                                {speed}x
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                      <button onClick={toggleOrientation} className="text-white hover:text-white/80 transition" title="Toggle Orientation">
                        <RotateCw size={20} />
                      </button>
                      <button onClick={toggleFullscreen} className="text-white hover:text-white/80 transition">
                        <Maximize2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Center Play Button */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition"
                  >
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center">
                      <Play size={32} className="text-black ml-1" />
                    </div>
                  </button>
                )}
              </>
            )}
          </div>
        </Card>

        {/* Video Info */}
        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold mb-2">{lesson.customTitle || lesson.title}</h2>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
            <span>Week {lesson.week}</span>
            <span>•</span>
            <span>Session {lesson.session}</span>
            {lesson.attendanceStatus === 'absent' && (
              <>
                <span>•</span>
                <Badge tone="danger">Absent</Badge>
              </>
            )}
          </div>
          {isGoogleDrive(lesson.recordingLink) && (
            <button
              onClick={() => {
                setMarkingWatched(true)
                markRecordingWatched(100, true).finally(() => setMarkingWatched(false))
              }}
              disabled={isMarkedWatched || markingWatched}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition mb-4 ${
                isMarkedWatched
                  ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {markingWatched ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Marking...
                </>
              ) : isMarkedWatched ? (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Watched
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Mark as Watched
                </>
              )}
            </button>
          )}
          {lesson.attendanceStatus === 'absent' && (
            <button
              onClick={() => setAppealOpen(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-amber-600 hover:text-amber-700"
            >
              <AlertCircle size={16} />
              Request Absence Pardon
            </button>
          )}
        </Card>

        {/* Appeal Modal */}
        <Modal
          open={appealOpen}
          onClose={() => setAppealOpen(false)}
          title="Request Absence Pardon"
          footer={
            <>
              <button
                onClick={() => setAppealOpen(false)}
                className="rounded-full border border-border px-5 py-2.5 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={submitAppeal}
                disabled={appealBusy}
                className="rounded-full bg-primary px-5 py-2.5 text-sm text-primary-foreground disabled:opacity-60"
              >
                {appealBusy ? 'Submitting…' : 'Submit Appeal'}
              </button>
            </>
          }
        >
          <div className="space-y-4">
            <Field label="Reason for absence">
              <Textarea
                value={appealReason}
                onChange={(e) => setAppealReason(e.target.value)}
                placeholder="Explain why you missed this class and why you should be pardoned..."
                rows={4}
              />
            </Field>
          </div>
        </Modal>
      </div>
    </div>
  )
}