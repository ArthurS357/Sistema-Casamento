import GiftsAdminClient from "./gifts-admin-client";

/**
 * Server Component: lê as credenciais do Cloudinary do ambiente
 * (sem NEXT_PUBLIC_, portanto invisíveis ao browser) e as repassa ao
 * client component via props. Sem isso o <CldUploadWidget> não teria
 * acesso ao cloudName/uploadPreset no client.
 */
export default async function GiftsAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <GiftsAdminClient
      id={id}
      cloudName={process.env.CLOUDINARY_CLOUD_NAME ?? ""}
      uploadPreset={process.env.CLOUDINARY_UPLOAD_PRESET ?? ""}
    />
  );
}
