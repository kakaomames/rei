import com.google.gson.JsonElement;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.JsonOps;
import io.netty.buffer.ByteBuf;

public record alp(alq b) implements aay<alo> {
   private static final ams<JsonElement> c;
   public static final aao<ByteBuf, alp> a;

   public alp(alq param1) {
      this.b = $$0;
   }

   public aba<alp> a() {
      return alt.a;
   }

   public void a(alo $$0) {
      $$0.a(this);
   }

   public alq b() {
      return this.b;
   }

   static {
      c = jr.b.a(JsonOps.INSTANCE);
      a = aao.a(aam.f(32767).a(aam.a((DynamicOps)c, (Codec)alq.a)), alp::b, alp::new);
   }
}
