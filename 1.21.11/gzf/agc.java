import io.netty.buffer.ByteBuf;
import java.util.Optional;

public record agc(yh b, Optional<byte[]> c) implements aay<adb> {
   public static final aao<ByteBuf, agc> a;

   public agc(yh param1, Optional<byte[]> param2) {
      this.b = $$0;
      this.c = $$1;
   }

   public aba<agc> a() {
      return ahz.ay;
   }

   public void a(adb $$0) {
      $$0.a(this);
   }

   public yh b() {
      return this.b;
   }

   public Optional<byte[]> e() {
      return this.c;
   }

   static {
      a = aao.a(yj.f, agc::b, aam.n.a(aam::a), agc::e, agc::new);
   }
}
