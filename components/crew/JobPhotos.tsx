import { Camera } from "lucide-react";
import Image from "next/image";
import { uploadJobPhotoAction } from "@/server/actions/job-photos";
import type { JobPhotoWithUrl } from "@/server/services/job-photos";

const TYPE_LABELS: Record<JobPhotoWithUrl["type"], string> = {
  before: "Before",
  after: "After",
  proof: "Proof",
  issue: "Issue",
  other: "Other",
};

export function JobPhotoGallery({
  photos,
  title = "Job photos",
}: {
  photos: JobPhotoWithUrl[];
  title?: string;
}) {
  if (photos.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
      <h2 className="mb-3 text-sm font-bold text-ink-950">{title}</h2>
      <div className="grid grid-cols-2 gap-3">
        {photos.map((photo) => (
          <figure key={photo.id} className="overflow-hidden rounded-xl ring-1 ring-ink-100">
            <div className="relative aspect-[4/3] bg-ink-50">
              <Image
                src={photo.url}
                alt={photo.caption ?? TYPE_LABELS[photo.type]}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 240px"
                unoptimized
              />
            </div>
            <figcaption className="px-2.5 py-2">
              <p className="text-xs font-semibold text-ink-700">{TYPE_LABELS[photo.type]}</p>
              {photo.caption && <p className="mt-0.5 text-xs text-ink-500">{photo.caption}</p>}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

type JobPhotoUploadProps = {
  jobId: string;
  photoCount: number;
  maxPhotos: number;
  disabled?: boolean;
};

export function JobPhotoUpload({ jobId, photoCount, maxPhotos, disabled }: JobPhotoUploadProps) {
  const atLimit = photoCount >= maxPhotos;

  return (
    <div className="mt-4 rounded-2xl bg-white p-4 ring-1 ring-ink-100 shadow-soft">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink-950">Photos</h2>
        <span className="text-xs font-semibold text-ink-500">
          {photoCount}/{maxPhotos}
        </span>
      </div>

      {atLimit ? (
        <p className="text-sm text-ink-500">Maximum photos reached for this job.</p>
      ) : (
        <form action={uploadJobPhotoAction} className="space-y-3">
          <input type="hidden" name="jobId" value={jobId} />
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Photo type
            </label>
            <select
              name="type"
              defaultValue="proof"
              disabled={disabled}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
            >
              <option value="before">Before</option>
              <option value="after">After</option>
              <option value="proof">Proof</option>
              <option value="issue">Issue</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Image
            </label>
            <input
              type="file"
              name="photo"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              required
              disabled={disabled}
              className="block w-full text-sm text-ink-700 file:mr-3 file:rounded-full file:border-0 file:bg-brand-100 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-900"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-ink-400">
              Caption (optional)
            </label>
            <input
              name="caption"
              maxLength={200}
              disabled={disabled}
              placeholder="e.g. Kitchen after clean"
              className="w-full rounded-xl bg-white px-3 py-2 text-sm ring-1 ring-ink-200"
            />
          </div>
          <button
            type="submit"
            disabled={disabled}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-ink-900 py-3 text-sm font-semibold text-white disabled:opacity-50"
          >
            <Camera className="size-4" /> Upload photo
          </button>
        </form>
      )}
    </div>
  );
}
