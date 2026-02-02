import com.google.gson.JsonElement;
import com.mojang.serialization.Codec;
import com.mojang.serialization.DynamicOps;
import com.mojang.serialization.JsonOps;
import io.netty.buffer.ByteBuf;

public record aks(yh b) implements aay<ako> {
   private static final ams<JsonElement> c;
   public static final aao<ByteBuf, aks> a;

   public aks(yh param1) {
      this.b = $$0;
   }

   public aba<aks> a() {
      return aku.e;
   }

   public void a(ako $$0) {
      $$0.a(this);
   }

   public yh b() {
      return this.b;
   }

   static {
      c = jr.b.a(JsonOps.INSTANCE);
      a = aao.a(aam.f(262144).a(aam.a((DynamicOps)c, (Codec)yj.a)), aks::b, aks::new);
   }
}
