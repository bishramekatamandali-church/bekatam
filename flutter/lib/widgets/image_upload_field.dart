import 'package:flutter/material.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../services/storage_service.dart';

/// Replaces the old "paste an Image URL" TextField pattern used across admin
/// forms with a real device upload (mirrors the Cloudinary upload flow the
/// React admin forms use). Still lets an admin paste/edit a URL directly —
/// upload just fills the same controller, so nothing about the underlying
/// column changes.
class ImageUploadField extends StatefulWidget {
  final TextEditingController controller;
  final String label;
  final String bucket;
  final String? pathPrefix;

  const ImageUploadField({
    super.key,
    required this.controller,
    required this.bucket,
    this.label = 'Image',
    this.pathPrefix,
  });

  @override
  State<ImageUploadField> createState() => _ImageUploadFieldState();
}

class _ImageUploadFieldState extends State<ImageUploadField> {
  bool _uploading = false;
  String? _error;

  Future<void> _pick() async {
    setState(() {
      _uploading = true;
      _error = null;
    });
    try {
      final url = await StorageService.pickAndUploadImage(
        bucket: widget.bucket,
        pathPrefix: widget.pathPrefix,
      );
      if (url != null) {
        widget.controller.text = url;
      }
    } catch (e) {
      _error = 'Upload failed: $e';
    } finally {
      if (mounted) setState(() => _uploading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(
              child: TextField(
                controller: widget.controller,
                decoration: InputDecoration(labelText: widget.label),
                onChanged: (_) => setState(() {}),
              ),
            ),
            const SizedBox(width: 8),
            IconButton.filledTonal(
              tooltip: 'Upload from device',
              onPressed: _uploading ? null : _pick,
              icon: _uploading
                  ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2))
                  : const Icon(Icons.upload),
            ),
          ],
        ),
        if (_error != null) Text(_error!, style: const TextStyle(color: Colors.red, fontSize: 12)),
        if (widget.controller.text.trim().isNotEmpty)
          Padding(
            padding: const EdgeInsets.only(top: 6),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(6),
              child: CachedNetworkImage(
                imageUrl: widget.controller.text.trim(),
                height: 80,
                fit: BoxFit.cover,
                errorWidget: (_, __, ___) => const SizedBox.shrink(),
              ),
            ),
          ),
      ],
    );
  }
}
