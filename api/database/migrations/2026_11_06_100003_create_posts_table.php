<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('posts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // restrictOnDelete: a category that still has posts cannot be removed
            $table->foreignId('category_id')->constrained()->restrictOnDelete();
            $table->string('title', 120);
            $table->string('excerpt', 300)->nullable();
            $table->longText('body');
            $table->string('status', 20)->default('draft');   // draft | published | hidden
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'published_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('posts');
    }
};
